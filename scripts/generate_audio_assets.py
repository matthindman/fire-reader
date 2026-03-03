#!/usr/bin/env python3
from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path

SR = 44_100
MAX_I16 = 32_767
TAU = math.tau

NOTE_OFFSETS = {
    'C': 0,
    'C#': 1,
    'D': 2,
    'D#': 3,
    'E': 4,
    'F': 5,
    'F#': 6,
    'G': 7,
    'G#': 8,
    'A': 9,
    'A#': 10,
    'B': 11
}


def hz(note: str) -> float:
    if note == 'R':
        return 0.0
    if len(note) == 2:
        name = note[0]
        octave = int(note[1])
    else:
        name = note[:2]
        octave = int(note[2])
    midi = (octave + 1) * 12 + NOTE_OFFSETS[name]
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def clamp(v: float) -> float:
    if v < -1.0:
        return -1.0
    if v > 1.0:
        return 1.0
    return v


def osc(phase: float, shape: str) -> float:
    x = (phase / TAU) % 1.0
    if shape == 'square':
        return 1.0 if x < 0.5 else -1.0
    if shape == 'triangle':
        return 1.0 - (4.0 * abs(x - 0.5))
    if shape == 'saw':
        return (2.0 * x) - 1.0
    return math.sin(phase)


def adsr(
    t: float,
    duration: float,
    attack: float = 0.01,
    decay: float = 0.05,
    sustain: float = 0.75,
    release: float = 0.08
) -> float:
    if t < 0 or t >= duration:
        return 0.0

    attack = min(attack, duration * 0.3)
    release = min(release, duration * 0.4)
    decay = min(decay, max(0.0, duration - attack - release))
    sustain_start = attack + decay
    sustain_end = max(sustain_start, duration - release)

    if attack > 0 and t < attack:
        return t / attack
    if decay > 0 and t < sustain_start:
        return 1.0 - (1.0 - sustain) * ((t - attack) / decay)
    if t < sustain_end:
        return sustain

    tail = max(duration - sustain_end, 1e-6)
    return max(0.0, sustain * (1.0 - ((t - sustain_end) / tail)))


def make_buffer(seconds: float) -> list[float]:
    return [0.0] * int(seconds * SR)


def normalize(buf: list[float], target_peak: float = 0.92) -> None:
    peak = 0.0
    for s in buf:
        peak = max(peak, abs(s))
    if peak <= 1e-6:
        return
    gain = min(1.0, target_peak / peak)
    if gain == 1.0:
        return
    for i in range(len(buf)):
        buf[i] *= gain


def add_tone(
    buf: list[float],
    start_s: float,
    dur_s: float,
    freq_hz: float,
    shape: str = 'square',
    vol: float = 0.2,
    vibrato_depth: float = 0.0,
    vibrato_hz: float = 5.0
) -> None:
    if freq_hz <= 0.0 or dur_s <= 0.0:
        return
    start_i = int(start_s * SR)
    end_i = min(len(buf), int((start_s + dur_s) * SR))
    phase = 0.0
    for i in range(start_i, end_i):
        t = (i - start_i) / SR
        freq = freq_hz * (1.0 + vibrato_depth * math.sin(TAU * vibrato_hz * t))
        phase += TAU * freq / SR
        env = adsr(t, dur_s)
        buf[i] += vol * env * osc(phase, shape)


def add_chirp(
    buf: list[float],
    start_s: float,
    dur_s: float,
    freq_start: float,
    freq_end: float,
    shape: str = 'sine',
    vol: float = 0.2
) -> None:
    start_i = int(start_s * SR)
    end_i = min(len(buf), int((start_s + dur_s) * SR))
    phase = 0.0
    for i in range(start_i, end_i):
        t = (i - start_i) / SR
        x = min(1.0, t / max(dur_s, 1e-6))
        freq = freq_start + (freq_end - freq_start) * x
        phase += TAU * freq / SR
        env = adsr(t, dur_s, attack=0.002, decay=0.02, sustain=0.6, release=0.03)
        buf[i] += vol * env * osc(phase, shape)


def add_noise(
    buf: list[float],
    start_s: float,
    dur_s: float,
    vol: float,
    seed: int,
    tilt_hz: float = 0.0
) -> None:
    start_i = int(start_s * SR)
    end_i = min(len(buf), int((start_s + dur_s) * SR))
    rng = random.Random(seed)
    for i in range(start_i, end_i):
        t = (i - start_i) / SR
        env = adsr(t, dur_s, attack=0.001, decay=0.03, sustain=0.32, release=0.04)
        n = rng.uniform(-1.0, 1.0)
        if tilt_hz > 0.0:
            n *= 0.7 + 0.3 * math.sin(TAU * tilt_hz * t)
        buf[i] += vol * env * n


def add_kick(buf: list[float], start_s: float, vol: float) -> None:
    dur_s = 0.16
    start_i = int(start_s * SR)
    end_i = min(len(buf), int((start_s + dur_s) * SR))
    phase = 0.0
    for i in range(start_i, end_i):
        t = (i - start_i) / SR
        x = min(1.0, t / dur_s)
        freq = 120.0 - 75.0 * x
        phase += TAU * freq / SR
        env = (1.0 - x) ** 2
        buf[i] += vol * env * math.sin(phase)


def add_snare(buf: list[float], start_s: float, vol: float, seed: int) -> None:
    add_noise(buf, start_s, 0.12, vol * 0.75, seed=seed, tilt_hz=400.0)
    add_tone(buf, start_s, 0.1, 196.0, shape='triangle', vol=vol * 0.25)


def add_hat(buf: list[float], start_s: float, vol: float, seed: int) -> None:
    add_noise(buf, start_s, 0.05, vol, seed=seed, tilt_hz=1200.0)


def write_wav(path: Path, buf: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    normalize(buf)
    data = bytearray()
    for s in buf:
        data.extend(struct.pack('<h', int(clamp(s) * MAX_I16)))
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(bytes(data))
    print(f'Wrote {path} ({len(buf) / SR:.2f}s)')


def render_loop(
    path: Path,
    bpm: float,
    bars: int,
    lead_cycle: list[list[str]],
    bass_cycle: list[list[str]],
    chord_cycle: list[tuple[str, str, str]]
) -> None:
    beat = 60.0 / bpm
    bar_secs = beat * 4.0
    total_secs = bars * bar_secs
    buf = make_buffer(total_secs)
    cycle_len = len(chord_cycle)

    for bar in range(bars):
        cycle_bar = bar % cycle_len
        bar_start = bar * bar_secs
        root, third, fifth = chord_cycle[cycle_bar]

        add_tone(buf, bar_start, bar_secs * 0.96, hz(root), shape='sine', vol=0.05)
        add_tone(buf, bar_start, bar_secs * 0.96, hz(third), shape='sine', vol=0.04)
        add_tone(buf, bar_start, bar_secs * 0.96, hz(fifth), shape='sine', vol=0.035)

        bass_notes = bass_cycle[cycle_bar]
        for q, note in enumerate(bass_notes):
            if note != 'R':
                add_tone(
                    buf,
                    bar_start + q * beat,
                    beat * 0.95,
                    hz(note),
                    shape='triangle',
                    vol=0.21
                )

        lead_notes = lead_cycle[cycle_bar]
        step = beat * 0.5
        for idx, note in enumerate(lead_notes):
            if note != 'R':
                add_tone(
                    buf,
                    bar_start + idx * step,
                    step * 0.92,
                    hz(note),
                    shape='square',
                    vol=0.16,
                    vibrato_depth=0.004,
                    vibrato_hz=5.2
                )

        for b in range(4):
            add_kick(buf, bar_start + b * beat, vol=0.26)
        add_snare(buf, bar_start + beat, vol=0.14, seed=10_000 + bar)
        add_snare(buf, bar_start + beat * 3.0, vol=0.14, seed=20_000 + bar)
        for h in range(8):
            add_hat(buf, bar_start + h * step + 0.01, vol=0.06, seed=30_000 + (bar * 8 + h))

    write_wav(path, buf)


def render_stinger(path: Path, notes: list[str], step_s: float, shape: str = 'square', vol: float = 0.25) -> None:
    total = max(0.2, len(notes) * step_s + 0.12)
    buf = make_buffer(total)
    t = 0.0
    for note in notes:
        if note != 'R':
            add_tone(buf, t, step_s * 0.9, hz(note), shape=shape, vol=vol)
        t += step_s
    write_wav(path, buf)


def render_ui_blip(path: Path, f0: float, f1: float, dur: float, shape: str, vol: float = 0.22) -> None:
    buf = make_buffer(dur + 0.05)
    add_chirp(buf, 0.0, dur, f0, f1, shape=shape, vol=vol)
    write_wav(path, buf)


def render_spray(path: Path, seed: int, bright: float) -> None:
    buf = make_buffer(0.22)
    add_noise(buf, 0.0, 0.18, vol=0.24, seed=seed, tilt_hz=900.0 + bright * 400.0)
    add_chirp(buf, 0.015, 0.14, 1800.0 + bright * 200.0, 700.0, shape='triangle', vol=0.09)
    write_wav(path, buf)


def render_hit_success(path: Path, notes: tuple[str, str, str], vol: float) -> None:
    buf = make_buffer(0.25)
    add_tone(buf, 0.0, 0.08, hz(notes[0]), shape='square', vol=vol)
    add_tone(buf, 0.07, 0.08, hz(notes[1]), shape='square', vol=vol * 0.95)
    add_tone(buf, 0.14, 0.09, hz(notes[2]), shape='triangle', vol=vol * 0.9)
    write_wav(path, buf)


def render_fail(path: Path, notes: tuple[str, str], vol: float) -> None:
    buf = make_buffer(0.33)
    add_tone(buf, 0.0, 0.14, hz(notes[0]), shape='saw', vol=vol)
    add_tone(buf, 0.14, 0.16, hz(notes[1]), shape='triangle', vol=vol * 0.9)
    write_wav(path, buf)


def render_hit_minor(path: Path) -> None:
    buf = make_buffer(0.17)
    add_tone(buf, 0.0, 0.15, hz('A4'), shape='triangle', vol=0.18)
    write_wav(path, buf)


def render_word_mastered(path: Path) -> None:
    buf = make_buffer(0.43)
    notes = ['C5', 'E5', 'G5', 'C6']
    t = 0.0
    for note in notes:
        add_tone(buf, t, 0.11, hz(note), shape='square', vol=0.19)
        t += 0.09
    write_wav(path, buf)


def render_unlock_reward(path: Path) -> None:
    buf = make_buffer(0.6)
    notes = ['G4', 'B4', 'D5', 'G5', 'D6']
    t = 0.0
    for note in notes:
        add_tone(buf, t, 0.12, hz(note), shape='triangle', vol=0.2)
        t += 0.1
    write_wav(path, buf)


def main() -> None:
    out = Path('assets/audio')
    music = out / 'music'
    sfx = out / 'sfx'
    music.mkdir(parents=True, exist_ok=True)
    sfx.mkdir(parents=True, exist_ok=True)

    render_loop(
        music / 'bgm_menu_loop.wav',
        bpm=112.0,
        bars=16,
        lead_cycle=[
            ['E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5', 'D5'],
            ['D5', 'E5', 'G5', 'E5', 'D5', 'C5', 'R', 'C5'],
            ['E5', 'G5', 'A5', 'C6', 'A5', 'G5', 'E5', 'D5'],
            ['C5', 'D5', 'E5', 'G5', 'E5', 'D5', 'C5', 'R']
        ],
        bass_cycle=[
            ['C3', 'C3', 'G2', 'G2'],
            ['A2', 'A2', 'E2', 'E2'],
            ['F2', 'F2', 'C3', 'C3'],
            ['G2', 'G2', 'D2', 'D2']
        ],
        chord_cycle=[
            ('C4', 'E4', 'G4'),
            ('A3', 'C4', 'E4'),
            ('F3', 'A3', 'C4'),
            ('G3', 'B3', 'D4')
        ]
    )

    render_loop(
        music / 'bgm_game_loop_a.wav',
        bpm=118.0,
        bars=16,
        lead_cycle=[
            ['G5', 'A5', 'B5', 'A5', 'G5', 'E5', 'D5', 'E5'],
            ['A5', 'B5', 'D6', 'B5', 'A5', 'G5', 'E5', 'R'],
            ['G5', 'A5', 'B5', 'D6', 'B5', 'A5', 'G5', 'E5'],
            ['D5', 'E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'R']
        ],
        bass_cycle=[
            ['G2', 'G2', 'D3', 'D3'],
            ['E2', 'E2', 'B2', 'B2'],
            ['C3', 'C3', 'G2', 'G2'],
            ['D3', 'D3', 'A2', 'A2']
        ],
        chord_cycle=[
            ('G3', 'B3', 'D4'),
            ('E3', 'G3', 'B3'),
            ('C4', 'E4', 'G4'),
            ('D3', 'F#3', 'A3')
        ]
    )

    render_loop(
        music / 'bgm_game_loop_b.wav',
        bpm=124.0,
        bars=16,
        lead_cycle=[
            ['A5', 'C6', 'E6', 'C6', 'A5', 'G5', 'E5', 'G5'],
            ['B5', 'D6', 'E6', 'D6', 'B5', 'A5', 'G5', 'R'],
            ['A5', 'C6', 'E6', 'G6', 'E6', 'D6', 'C6', 'A5'],
            ['G5', 'A5', 'B5', 'D6', 'B5', 'A5', 'G5', 'R']
        ],
        bass_cycle=[
            ['A2', 'A2', 'E3', 'E3'],
            ['B2', 'B2', 'F#3', 'F#3'],
            ['D3', 'D3', 'A2', 'A2'],
            ['E3', 'E3', 'B2', 'B2']
        ],
        chord_cycle=[
            ('A3', 'C4', 'E4'),
            ('B3', 'D4', 'F#4'),
            ('D4', 'F#4', 'A4'),
            ('E3', 'G3', 'B3')
        ]
    )

    render_loop(
        music / 'bgm_game_loop_c.wav',
        bpm=132.0,
        bars=16,
        lead_cycle=[
            ['C6', 'B5', 'A5', 'G5', 'A5', 'C6', 'D6', 'C6'],
            ['E6', 'D6', 'C6', 'A5', 'C6', 'D6', 'E6', 'R'],
            ['F6', 'E6', 'D6', 'C6', 'D6', 'F6', 'G6', 'F6'],
            ['E6', 'D6', 'C6', 'A5', 'G5', 'A5', 'C6', 'R']
        ],
        bass_cycle=[
            ['C3', 'C3', 'G2', 'G2'],
            ['A2', 'A2', 'E2', 'E2'],
            ['F2', 'F2', 'C3', 'C3'],
            ['G2', 'G2', 'D2', 'D2']
        ],
        chord_cycle=[
            ('C4', 'E4', 'G4'),
            ('A3', 'C4', 'E4'),
            ('F3', 'A3', 'C4'),
            ('G3', 'B3', 'D4')
        ]
    )

    render_stinger(music / 'stinger_level_clear.wav', ['C5', 'E5', 'G5', 'C6', 'E6'], 0.09, shape='square', vol=0.23)
    render_stinger(music / 'stinger_level_fail.wav', ['E5', 'D5', 'C5', 'A4'], 0.11, shape='triangle', vol=0.2)
    render_stinger(music / 'stinger_boss_end.wav', ['G4', 'B4', 'D5', 'G5'], 0.1, shape='square', vol=0.22)

    render_ui_blip(sfx / 'ui_click_v01.wav', 780.0, 1020.0, 0.06, 'square', vol=0.16)
    render_ui_blip(sfx / 'ui_confirm_v01.wav', 620.0, 1260.0, 0.09, 'triangle', vol=0.2)
    render_ui_blip(sfx / 'ui_back_v01.wav', 760.0, 480.0, 0.09, 'triangle', vol=0.19)
    render_ui_blip(sfx / 'ui_toggle_on_v01.wav', 540.0, 1300.0, 0.11, 'square', vol=0.22)
    render_ui_blip(sfx / 'ui_toggle_off_v01.wav', 1180.0, 420.0, 0.11, 'saw', vol=0.2)

    render_spray(sfx / 'spray_shot_v01.wav', seed=1_001, bright=0.3)
    render_spray(sfx / 'spray_shot_v02.wav', seed=2_002, bright=0.75)

    render_hit_success(sfx / 'hit_success_v01.wav', ('C5', 'E5', 'G5'), vol=0.22)
    render_hit_success(sfx / 'hit_success_v02.wav', ('D5', 'F#5', 'A5'), vol=0.22)
    render_hit_minor(sfx / 'hit_minor_v01.wav')

    render_fail(sfx / 'fail_try_again_v01.wav', ('E5', 'C5'), vol=0.2)
    render_fail(sfx / 'fail_try_again_v02.wav', ('D5', 'B4'), vol=0.2)

    render_word_mastered(sfx / 'word_mastered_v01.wav')
    render_unlock_reward(sfx / 'unlock_reward_v01.wav')


if __name__ == '__main__':
    main()
