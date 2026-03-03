#!/usr/bin/env python3
"""
Fire-Reader audio asset generator (v2.0)

Generates 4 chiptune music loops + 3 stingers + all SFX using proper
NES-era synthesis techniques:
  - Pulse waves with duty-cycle modulation (12.5%, 25%, 50%)
  - Triangle bass, noise percussion
  - Echo/delay, low-pass filtering, vibrato, pitch slides
  - Dynamic velocity with accents and swells
  - Varied drum patterns with fills every 4 bars
  - Extended compositions (48-64 bars, ~50-65 seconds)
"""
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
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
}

# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------

def hz(note: str) -> float:
    if note == 'R':
        return 0.0
    if note[-1].isdigit():
        octave = int(note[-1])
        name = note[:-1]
    else:
        return 0.0
    midi = (octave + 1) * 12 + NOTE_OFFSETS[name]
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def clamp(v: float) -> float:
    return max(-1.0, min(1.0, v))


def make_buffer(seconds: float) -> list[float]:
    return [0.0] * int(seconds * SR)


def normalize(buf: list[float], target_peak: float = 0.92) -> None:
    peak = max((abs(s) for s in buf), default=0.0)
    if peak <= 1e-6:
        return
    gain = min(1.0, target_peak / peak)
    if gain >= 0.999:
        return
    for i in range(len(buf)):
        buf[i] *= gain


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
    print(f'  Wrote {path} ({len(buf) / SR:.2f}s)')


# ---------------------------------------------------------------------------
# Oscillators with duty-cycle modulation
# ---------------------------------------------------------------------------

def osc_pulse(phase: float, duty: float = 0.5) -> float:
    """NES-style pulse wave with variable duty cycle."""
    x = (phase / TAU) % 1.0
    return 1.0 if x < duty else -1.0


def osc_triangle(phase: float) -> float:
    """NES triangle channel — 4-bit quantized for authenticity."""
    x = (phase / TAU) % 1.0
    val = 1.0 - 4.0 * abs(x - 0.5)
    # Quantize to 16 steps (4-bit) like NES triangle
    return round(val * 7.5) / 7.5


def osc_saw(phase: float) -> float:
    x = (phase / TAU) % 1.0
    return 2.0 * x - 1.0


def osc_sine(phase: float) -> float:
    return math.sin(phase)


def osc(phase: float, shape: str, duty: float = 0.5) -> float:
    if shape == 'pulse' or shape == 'square':
        return osc_pulse(phase, duty)
    if shape == 'triangle':
        return osc_triangle(phase)
    if shape == 'saw':
        return osc_saw(phase)
    return osc_sine(phase)


# ---------------------------------------------------------------------------
# ADSR envelope
# ---------------------------------------------------------------------------

def adsr(
    t: float, duration: float,
    attack: float = 0.01, decay: float = 0.05,
    sustain: float = 0.75, release: float = 0.08
) -> float:
    if t < 0 or t >= duration:
        return 0.0
    attack = min(attack, duration * 0.3)
    release = min(release, duration * 0.4)
    decay = min(decay, max(0.0, duration - attack - release))
    sus_start = attack + decay
    sus_end = max(sus_start, duration - release)

    if attack > 0 and t < attack:
        return t / attack
    if decay > 0 and t < sus_start:
        return 1.0 - (1.0 - sustain) * ((t - attack) / decay)
    if t < sus_end:
        return sustain
    tail = max(duration - sus_end, 1e-6)
    return max(0.0, sustain * (1.0 - (t - sus_end) / tail))


# ---------------------------------------------------------------------------
# Low-pass filter (first-order IIR)
# ---------------------------------------------------------------------------

def apply_lowpass(buf: list[float], cutoff_hz: float) -> None:
    """Simple first-order IIR low-pass to soften harsh square wave harmonics."""
    if cutoff_hz <= 0 or cutoff_hz >= SR / 2:
        return
    rc = 1.0 / (TAU * cutoff_hz)
    dt = 1.0 / SR
    alpha = dt / (rc + dt)
    prev = 0.0
    for i in range(len(buf)):
        prev += alpha * (buf[i] - prev)
        buf[i] = prev


def apply_lowpass_range(buf: list[float], start_i: int, end_i: int, cutoff_hz: float) -> None:
    """Apply low-pass filter to a range of samples."""
    if cutoff_hz <= 0 or cutoff_hz >= SR / 2:
        return
    rc = 1.0 / (TAU * cutoff_hz)
    dt = 1.0 / SR
    alpha = dt / (rc + dt)
    prev = buf[start_i] if start_i < len(buf) else 0.0
    for i in range(start_i, min(end_i, len(buf))):
        prev += alpha * (buf[i] - prev)
        buf[i] = prev


# ---------------------------------------------------------------------------
# Echo / delay
# ---------------------------------------------------------------------------

def apply_echo(buf: list[float], delay_ms: float = 100.0, mix: float = 0.2,
               feedback: float = 0.3) -> None:
    """Short delay line for depth. Two taps for richness."""
    delay_samples = int(delay_ms * SR / 1000.0)
    delay2 = int(delay_ms * 0.66 * SR / 1000.0)
    if delay_samples <= 0:
        return
    out = list(buf)
    for i in range(len(buf)):
        echo1 = buf[i - delay_samples] if i >= delay_samples else 0.0
        echo2 = buf[i - delay2] if i >= delay2 else 0.0
        out[i] = buf[i] + mix * echo1 + mix * 0.5 * echo2
        # Feedback into delay line
        if i >= delay_samples:
            buf[i] += feedback * echo1 * mix
    for i in range(len(buf)):
        buf[i] = out[i]


# ---------------------------------------------------------------------------
# Tone rendering with advanced features
# ---------------------------------------------------------------------------

def add_tone(
    buf: list[float], start_s: float, dur_s: float, freq_hz: float,
    shape: str = 'pulse', vol: float = 0.2, duty: float = 0.5,
    vibrato_depth: float = 0.0, vibrato_hz: float = 5.0,
    vibrato_delay: float = 0.08,
    pitch_slide_hz: float = 0.0,
    attack: float = 0.01, decay: float = 0.05,
    sustain: float = 0.75, release: float = 0.08,
    duty_sweep: float = 0.0,
) -> None:
    """Render a tone with NES-style features: duty cycle, vibrato, pitch slides."""
    if freq_hz <= 0.0 or dur_s <= 0.0:
        return
    start_i = int(start_s * SR)
    end_i = min(len(buf), int((start_s + dur_s) * SR))
    phase = 0.0
    for i in range(start_i, end_i):
        t = (i - start_i) / SR
        frac = min(1.0, t / dur_s) if dur_s > 0 else 0.0

        # Pitch slide
        freq = freq_hz + pitch_slide_hz * frac

        # Vibrato (delayed onset for more natural feel)
        if vibrato_depth > 0 and t > vibrato_delay:
            vib_t = t - vibrato_delay
            freq *= 1.0 + vibrato_depth * math.sin(TAU * vibrato_hz * vib_t)

        phase += TAU * freq / SR
        env = adsr(t, dur_s, attack, decay, sustain, release)

        # Duty cycle sweep
        d = duty + duty_sweep * frac
        d = max(0.125, min(0.75, d))

        buf[i] += vol * env * osc(phase, shape, d)


def add_arpeggio(
    buf: list[float], start_s: float, dur_s: float,
    notes: list[float], rate_hz: float = 15.0,
    shape: str = 'pulse', vol: float = 0.15, duty: float = 0.25,
    attack: float = 0.005, decay: float = 0.03,
    sustain: float = 0.7, release: float = 0.06,
) -> None:
    """NES-style rapid arpeggio cycling through note frequencies."""
    if not notes or dur_s <= 0:
        return
    start_i = int(start_s * SR)
    end_i = min(len(buf), int((start_s + dur_s) * SR))
    phase = 0.0
    step_samples = max(1, int(SR / rate_hz))
    for i in range(start_i, end_i):
        t = (i - start_i) / SR
        # Cycle through notes
        note_idx = ((i - start_i) // step_samples) % len(notes)
        freq = notes[note_idx]
        if freq <= 0:
            continue
        phase += TAU * freq / SR
        env = adsr(t, dur_s, attack, decay, sustain, release)
        buf[i] += vol * env * osc(phase, shape, duty)


# ---------------------------------------------------------------------------
# Chirp / sweep
# ---------------------------------------------------------------------------

def add_chirp(
    buf: list[float], start_s: float, dur_s: float,
    freq_start: float, freq_end: float,
    shape: str = 'sine', vol: float = 0.2, duty: float = 0.5
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
        buf[i] += vol * env * osc(phase, shape, duty)


# ---------------------------------------------------------------------------
# Noise
# ---------------------------------------------------------------------------

def add_noise(
    buf: list[float], start_s: float, dur_s: float,
    vol: float, seed: int, tilt_hz: float = 0.0,
    attack: float = 0.001, decay: float = 0.03,
    sustain: float = 0.32, release: float = 0.04
) -> None:
    start_i = int(start_s * SR)
    end_i = min(len(buf), int((start_s + dur_s) * SR))
    rng = random.Random(seed)
    for i in range(start_i, end_i):
        t = (i - start_i) / SR
        env = adsr(t, dur_s, attack=attack, decay=decay, sustain=sustain, release=release)
        n = rng.uniform(-1.0, 1.0)
        if tilt_hz > 0.0:
            n *= 0.7 + 0.3 * math.sin(TAU * tilt_hz * t)
        buf[i] += vol * env * n


# ---------------------------------------------------------------------------
# Drum synthesis — NES-style
# ---------------------------------------------------------------------------

def add_kick(buf: list[float], start_s: float, vol: float,
             pitch: float = 120.0, decay_time: float = 0.16) -> None:
    """Kick drum — pitch-bent sine wave."""
    dur_s = decay_time
    start_i = int(start_s * SR)
    end_i = min(len(buf), int((start_s + dur_s) * SR))
    phase = 0.0
    for i in range(start_i, end_i):
        t = (i - start_i) / SR
        x = min(1.0, t / dur_s)
        # Exponential pitch drop
        freq = pitch * (1.0 - 0.7 * x) ** 2 + 30.0
        phase += TAU * freq / SR
        env = (1.0 - x) ** 2.5
        buf[i] += vol * env * math.sin(phase)


def add_snare(buf: list[float], start_s: float, vol: float, seed: int,
              tone_pitch: float = 196.0, bright: bool = True) -> None:
    """Snare — noise burst + tonal body."""
    add_noise(buf, start_s, 0.12, vol * 0.7, seed=seed,
              tilt_hz=600.0 if bright else 400.0,
              attack=0.001, decay=0.04, sustain=0.25, release=0.05)
    add_tone(buf, start_s, 0.08, tone_pitch, shape='triangle',
             vol=vol * 0.3, attack=0.001, decay=0.02, sustain=0.2, release=0.03)


def add_hat(buf: list[float], start_s: float, vol: float, seed: int,
            open_hat: bool = False) -> None:
    """Hi-hat — short noise burst (closed) or longer (open)."""
    dur = 0.14 if open_hat else 0.04
    sus = 0.4 if open_hat else 0.15
    add_noise(buf, start_s, dur, vol, seed=seed, tilt_hz=2400.0,
              attack=0.001, decay=0.01, sustain=sus, release=0.02)


def add_ghost_snare(buf: list[float], start_s: float, vol: float, seed: int) -> None:
    """Ghost snare — very quiet, adds groove."""
    add_snare(buf, start_s, vol * 0.35, seed, tone_pitch=180.0, bright=False)


# ---------------------------------------------------------------------------
# Drum pattern generator
# ---------------------------------------------------------------------------

def render_drums(
    buf: list[float], bar_start: float, beat: float, bar_num: int,
    intensity: float = 0.5, fill: bool = False, swing: float = 0.0
) -> None:
    """Render a full bar of drums with variable intensity and optional fills."""
    kick_vol = 0.22 + 0.08 * intensity
    snare_vol = 0.12 + 0.06 * intensity
    hat_vol = 0.05 + 0.04 * intensity
    seed_base = bar_num * 100

    step = beat * 0.5  # eighth note

    if fill:
        # Drum fill — build energy
        add_kick(buf, bar_start, kick_vol)
        add_kick(buf, bar_start + beat, kick_vol * 0.9)
        add_snare(buf, bar_start + beat * 1.5, snare_vol * 1.1, seed_base + 50)
        add_snare(buf, bar_start + beat * 2.0, snare_vol * 1.2, seed_base + 51)
        add_snare(buf, bar_start + beat * 2.5, snare_vol * 1.3, seed_base + 52, bright=True)
        add_kick(buf, bar_start + beat * 3.0, kick_vol * 1.1)
        add_snare(buf, bar_start + beat * 3.25, snare_vol * 0.9, seed_base + 53)
        add_snare(buf, bar_start + beat * 3.5, snare_vol * 1.4, seed_base + 54, bright=True)
        add_hat(buf, bar_start + beat * 3.75, hat_vol * 1.5, seed_base + 55, open_hat=True)
        return

    # Standard pattern
    # Kick: beat 1, beat 3 (with variation)
    add_kick(buf, bar_start, kick_vol)
    add_kick(buf, bar_start + beat * 2, kick_vol * 0.95)
    # Extra kick on beat 4 "and" for energy
    if intensity > 0.6 and bar_num % 2 == 1:
        add_kick(buf, bar_start + beat * 3.5, kick_vol * 0.7)

    # Snare: beat 2, beat 4
    add_snare(buf, bar_start + beat, snare_vol, seed_base + 10)
    add_snare(buf, bar_start + beat * 3, snare_vol, seed_base + 20)

    # Ghost snares for groove
    if intensity > 0.3:
        if bar_num % 2 == 0:
            add_ghost_snare(buf, bar_start + beat * 0.5, snare_vol, seed_base + 30)
        else:
            add_ghost_snare(buf, bar_start + beat * 2.5, snare_vol, seed_base + 31)

    # Hi-hats: eighth notes with swing and open hat variation
    for h in range(8):
        t_offset = h * step
        # Apply swing to off-beats
        if h % 2 == 1 and swing > 0:
            t_offset += step * swing * 0.3
        is_open = (h == 3 or h == 7) and intensity > 0.4
        v = hat_vol * (1.1 if h % 2 == 0 else 0.8)
        add_hat(buf, bar_start + t_offset, v, seed_base + 40 + h, open_hat=is_open)


# ---------------------------------------------------------------------------
# Composition structures
# ---------------------------------------------------------------------------

# Note sequences: each sub-list is one bar of eighth notes (8 per bar)
# 'R' = rest

def _expand_melody(pattern: list[list[str]], bars: int) -> list[list[str]]:
    """Expand a melody pattern to fill the required number of bars."""
    result = []
    plen = len(pattern)
    for i in range(bars):
        result.append(pattern[i % plen])
    return result


def _expand_bass(pattern: list[list[str]], bars: int) -> list[list[str]]:
    """Expand a bass pattern (quarter notes, 4 per bar)."""
    result = []
    plen = len(pattern)
    for i in range(bars):
        result.append(pattern[i % plen])
    return result


def _expand_chords(pattern: list[tuple[str, str, str]], bars: int) -> list[tuple[str, str, str]]:
    result = []
    plen = len(pattern)
    for i in range(bars):
        result.append(pattern[i % plen])
    return result


# ---------------------------------------------------------------------------
# Advanced loop renderer
# ---------------------------------------------------------------------------

def render_loop(
    path: Path,
    bpm: float,
    bars: int,
    sections: list[dict],
    echo_ms: float = 95.0,
    echo_mix: float = 0.18,
    lowpass_hz: float = 8000.0,
    intensity_curve: str = 'flat',
) -> None:
    """
    Render a multi-section music loop.

    Each section dict has:
      - bars: int — how many bars in this section
      - lead: list of bar patterns (eighth notes)
      - bass: list of bar patterns (quarter notes)
      - chords: list of (root, third, fifth) tuples
      - lead_shape: str (default 'pulse')
      - lead_duty: float (default 0.5)
      - lead_vol: float (default 0.16)
      - bass_shape: str (default 'triangle')
      - bass_vol: float (default 0.20)
      - chord_vol: float (default 0.04)
      - drum_intensity: float (0-1)
      - swing: float (0-1)
      - vibrato: float (depth)
    """
    beat = 60.0 / bpm
    bar_secs = beat * 4.0
    total_secs = bars * bar_secs
    buf = make_buffer(total_secs + 0.1)  # tiny padding

    global_bar = 0

    for section in sections:
        sec_bars = section['bars']
        lead_patterns = section.get('lead', [['R'] * 8])
        bass_patterns = section.get('bass', [['R'] * 4])
        chord_patterns = section.get('chords', [('C4', 'E4', 'G4')])
        lead_shape = section.get('lead_shape', 'pulse')
        lead_duty = section.get('lead_duty', 0.5)
        lead_vol = section.get('lead_vol', 0.16)
        bass_shape = section.get('bass_shape', 'triangle')
        bass_vol = section.get('bass_vol', 0.20)
        chord_vol = section.get('chord_vol', 0.04)
        drum_intensity = section.get('drum_intensity', 0.5)
        swing = section.get('swing', 0.0)
        vibrato = section.get('vibrato', 0.004)
        lead_duty_sweep = section.get('lead_duty_sweep', 0.0)
        counter_melody = section.get('counter', None)
        counter_shape = section.get('counter_shape', 'pulse')
        counter_duty = section.get('counter_duty', 0.25)
        counter_vol = section.get('counter_vol', 0.08)

        lead = _expand_melody(lead_patterns, sec_bars)
        bass = _expand_bass(bass_patterns, sec_bars)
        chords = _expand_chords(chord_patterns, sec_bars)
        counter = _expand_melody(counter_melody, sec_bars) if counter_melody else None

        for local_bar in range(sec_bars):
            bar_start = global_bar * bar_secs

            # Intensity curve
            if intensity_curve == 'rise':
                bar_frac = global_bar / max(bars - 1, 1)
                int_mult = 0.7 + 0.3 * bar_frac
            elif intensity_curve == 'wave':
                bar_frac = global_bar / max(bars - 1, 1)
                int_mult = 0.8 + 0.2 * math.sin(bar_frac * TAU * 2)
            else:
                int_mult = 1.0

            # Pad chords (held whole notes, quiet)
            root, third, fifth = chords[local_bar]
            for note_name, cvol_mult in [(root, 1.0), (third, 0.85), (fifth, 0.75)]:
                f = hz(note_name)
                if f > 0:
                    add_tone(buf, bar_start, bar_secs * 0.96, f,
                             shape='sine', vol=chord_vol * cvol_mult * int_mult,
                             attack=0.05, decay=0.1, sustain=0.6, release=0.15)

            # Bass line (quarter notes)
            bass_notes = bass[local_bar]
            for q, note in enumerate(bass_notes):
                if note != 'R':
                    vel = bass_vol * int_mult
                    # Accent beat 1
                    if q == 0:
                        vel *= 1.1
                    add_tone(buf, bar_start + q * beat, beat * 0.9, hz(note),
                             shape=bass_shape, vol=vel,
                             attack=0.005, decay=0.04, sustain=0.65, release=0.06)

            # Lead melody (eighth notes)
            step = beat * 0.5
            lead_notes = lead[local_bar]
            for idx, note in enumerate(lead_notes):
                if note != 'R':
                    vel = lead_vol * int_mult
                    # Accent pattern: beat 1 and 3 louder
                    if idx % 4 == 0:
                        vel *= 1.12
                    elif idx % 2 == 0:
                        vel *= 1.05

                    # Pitch slide from previous note
                    slide = 0.0
                    if idx > 0 and lead_notes[idx - 1] != 'R':
                        prev_f = hz(lead_notes[idx - 1])
                        curr_f = hz(note)
                        if prev_f > 0 and curr_f > 0:
                            diff = curr_f - prev_f
                            if abs(diff) > 20:
                                slide = -diff * 0.15  # Slight slide toward target

                    add_tone(buf, bar_start + idx * step, step * 0.88, hz(note),
                             shape=lead_shape, vol=vel, duty=lead_duty,
                             vibrato_depth=vibrato, vibrato_hz=5.5,
                             vibrato_delay=0.06,
                             pitch_slide_hz=slide,
                             attack=0.005, decay=0.04, sustain=0.7, release=0.05,
                             duty_sweep=lead_duty_sweep)

            # Counter melody (optional, quieter pulse channel)
            if counter:
                counter_notes = counter[local_bar]
                for idx, note in enumerate(counter_notes):
                    if note != 'R':
                        add_tone(buf, bar_start + idx * step, step * 0.85, hz(note),
                                 shape=counter_shape, vol=counter_vol * int_mult,
                                 duty=counter_duty,
                                 vibrato_depth=vibrato * 0.5, vibrato_hz=4.8,
                                 attack=0.008, decay=0.03, sustain=0.55, release=0.04)

            # Drums
            is_fill = (local_bar + 1) % 4 == 0 and local_bar > 0
            render_drums(buf, bar_start, beat, global_bar,
                         intensity=drum_intensity * int_mult,
                         fill=is_fill, swing=swing)

            global_bar += 1

    # Post-processing
    apply_echo(buf, delay_ms=echo_ms, mix=echo_mix, feedback=0.25)
    apply_lowpass(buf, lowpass_hz)

    # Trim to exact loop length (remove padding)
    exact_len = int(bars * bar_secs * SR)
    if len(buf) > exact_len:
        buf[exact_len:] = []

    # Crossfade loop point for seamless looping (last 200 samples)
    fade_len = min(200, len(buf) // 4)
    for i in range(fade_len):
        frac = i / fade_len
        buf[i] = buf[i] * frac + buf[-(fade_len - i)] * (1.0 - frac)

    write_wav(path, buf)


# ---------------------------------------------------------------------------
# Music compositions
# ---------------------------------------------------------------------------

def compose_menu_loop(path: Path) -> None:
    """
    Menu theme — Bright, gentle C major bounce.
    Inviting, cheerful, relaxed. Like a sunny morning.
    ~55 seconds at 112 BPM, 48 bars.
    """
    # Section A: Main theme (gentle, catchy)
    a_lead = [
        ['E5', 'R', 'G5', 'A5', 'G5', 'R', 'E5', 'D5'],
        ['C5', 'R', 'D5', 'E5', 'R', 'C5', 'R', 'R'],
        ['E5', 'R', 'G5', 'A5', 'C6', 'R', 'A5', 'G5'],
        ['E5', 'R', 'D5', 'C5', 'R', 'R', 'R', 'R'],
        ['F5', 'R', 'A5', 'G5', 'F5', 'R', 'E5', 'D5'],
        ['C5', 'R', 'E5', 'D5', 'C5', 'R', 'R', 'R'],
        ['D5', 'R', 'F5', 'E5', 'D5', 'R', 'E5', 'G5'],
        ['E5', 'R', 'D5', 'C5', 'R', 'R', 'R', 'R'],
    ]
    a_bass = [
        ['C3', 'R', 'G3', 'R'],
        ['C3', 'R', 'E3', 'R'],
        ['A2', 'R', 'E3', 'R'],
        ['A2', 'R', 'C3', 'R'],
        ['F2', 'R', 'C3', 'R'],
        ['F2', 'R', 'A2', 'R'],
        ['G2', 'R', 'D3', 'R'],
        ['G2', 'R', 'B2', 'R'],
    ]
    a_chords = [
        ('C4', 'E4', 'G4'),
        ('C4', 'E4', 'G4'),
        ('A3', 'C4', 'E4'),
        ('A3', 'C4', 'E4'),
        ('F3', 'A3', 'C4'),
        ('F3', 'A3', 'C4'),
        ('G3', 'B3', 'D4'),
        ('G3', 'B3', 'D4'),
    ]

    # Section B: Bridge — slightly different feel
    b_lead = [
        ['G5', 'R', 'A5', 'B5', 'C6', 'R', 'B5', 'A5'],
        ['G5', 'R', 'E5', 'R', 'R', 'R', 'R', 'R'],
        ['A5', 'R', 'B5', 'C6', 'D6', 'R', 'C6', 'B5'],
        ['A5', 'R', 'G5', 'R', 'R', 'R', 'R', 'R'],
        ['F5', 'R', 'G5', 'A5', 'G5', 'R', 'F5', 'E5'],
        ['D5', 'R', 'E5', 'F5', 'E5', 'R', 'D5', 'C5'],
        ['D5', 'R', 'E5', 'F5', 'G5', 'R', 'A5', 'G5'],
        ['E5', 'R', 'D5', 'C5', 'R', 'R', 'R', 'R'],
    ]
    b_bass = [
        ['G2', 'R', 'D3', 'R'],
        ['G2', 'R', 'B2', 'R'],
        ['A2', 'R', 'E3', 'R'],
        ['A2', 'R', 'C3', 'R'],
        ['F2', 'R', 'C3', 'R'],
        ['D3', 'R', 'A2', 'R'],
        ['G2', 'R', 'D3', 'R'],
        ['C3', 'R', 'G2', 'R'],
    ]
    b_chords = [
        ('G3', 'B3', 'D4'),
        ('G3', 'B3', 'D4'),
        ('A3', 'C4', 'E4'),
        ('A3', 'C4', 'E4'),
        ('F3', 'A3', 'C4'),
        ('D3', 'F3', 'A3'),
        ('G3', 'B3', 'D4'),
        ('C4', 'E4', 'G4'),
    ]

    # Counter melody for B section
    b_counter = [
        ['R', 'R', 'R', 'R', 'E5', 'R', 'D5', 'R'],
        ['R', 'R', 'C5', 'R', 'R', 'R', 'R', 'R'],
        ['R', 'R', 'R', 'R', 'F5', 'R', 'E5', 'R'],
        ['R', 'R', 'D5', 'R', 'R', 'R', 'R', 'R'],
        ['R', 'R', 'R', 'R', 'C5', 'R', 'R', 'R'],
        ['R', 'R', 'R', 'R', 'A4', 'R', 'R', 'R'],
        ['R', 'R', 'R', 'R', 'B4', 'R', 'C5', 'R'],
        ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
    ]

    sections = [
        # A section (16 bars) — intro, gentle
        {
            'bars': 16, 'lead': a_lead, 'bass': a_bass, 'chords': a_chords,
            'lead_shape': 'pulse', 'lead_duty': 0.25, 'lead_vol': 0.14,
            'bass_vol': 0.18, 'chord_vol': 0.035,
            'drum_intensity': 0.35, 'swing': 0.3, 'vibrato': 0.003,
        },
        # B section (16 bars) — bridge, slightly more energy
        {
            'bars': 16, 'lead': b_lead, 'bass': b_bass, 'chords': b_chords,
            'lead_shape': 'pulse', 'lead_duty': 0.5, 'lead_vol': 0.15,
            'bass_vol': 0.19, 'chord_vol': 0.04,
            'drum_intensity': 0.45, 'swing': 0.25, 'vibrato': 0.004,
            'counter': b_counter, 'counter_duty': 0.125, 'counter_vol': 0.06,
        },
        # A' section (16 bars) — return with slight variation
        {
            'bars': 16, 'lead': a_lead, 'bass': a_bass, 'chords': a_chords,
            'lead_shape': 'pulse', 'lead_duty': 0.5, 'lead_vol': 0.15,
            'bass_vol': 0.19, 'chord_vol': 0.04,
            'drum_intensity': 0.42, 'swing': 0.3, 'vibrato': 0.005,
            'lead_duty_sweep': -0.15,
        },
    ]

    render_loop(path, bpm=112.0, bars=48, sections=sections,
                echo_ms=110.0, echo_mix=0.20, lowpass_hz=7500.0)


def compose_game_loop_a(path: Path) -> None:
    """
    Game A (Levels 1-3) — Playful G major with simple catchy melody.
    Warm, bouncy, confidence-building.
    ~52 seconds at 118 BPM, 48 bars.
    """
    a_lead = [
        ['G5', 'R', 'A5', 'B5', 'R', 'A5', 'G5', 'R'],
        ['E5', 'R', 'D5', 'E5', 'R', 'R', 'R', 'R'],
        ['G5', 'R', 'A5', 'B5', 'D6', 'R', 'B5', 'A5'],
        ['G5', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
        ['A5', 'R', 'B5', 'C6', 'R', 'B5', 'A5', 'R'],
        ['G5', 'R', 'E5', 'G5', 'R', 'R', 'R', 'R'],
        ['D5', 'R', 'E5', 'G5', 'A5', 'R', 'G5', 'E5'],
        ['D5', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
    ]
    a_bass = [
        ['G2', 'R', 'D3', 'R'],
        ['E2', 'R', 'B2', 'R'],
        ['G2', 'R', 'D3', 'R'],
        ['G2', 'R', 'B2', 'R'],
        ['C3', 'R', 'G2', 'R'],
        ['C3', 'R', 'E3', 'R'],
        ['D3', 'R', 'A2', 'R'],
        ['D3', 'R', 'G2', 'R'],
    ]
    a_chords = [
        ('G3', 'B3', 'D4'),
        ('E3', 'G3', 'B3'),
        ('G3', 'B3', 'D4'),
        ('G3', 'B3', 'D4'),
        ('C4', 'E4', 'G4'),
        ('C4', 'E4', 'G4'),
        ('D3', 'F#3', 'A3'),
        ('D3', 'F#3', 'A3'),
    ]

    # Section B — call and response
    b_lead = [
        ['B5', 'R', 'D6', 'R', 'B5', 'R', 'G5', 'R'],
        ['R', 'R', 'R', 'R', 'A5', 'R', 'B5', 'D6'],
        ['E6', 'R', 'D6', 'R', 'B5', 'R', 'A5', 'R'],
        ['G5', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
        ['G5', 'R', 'B5', 'R', 'D6', 'R', 'E6', 'R'],
        ['D6', 'R', 'B5', 'R', 'R', 'R', 'A5', 'G5'],
        ['A5', 'R', 'B5', 'R', 'A5', 'R', 'G5', 'R'],
        ['R', 'R', 'E5', 'R', 'D5', 'R', 'R', 'R'],
    ]
    b_bass = [
        ['G2', 'R', 'D3', 'G2'],
        ['E2', 'R', 'B2', 'E3'],
        ['C3', 'R', 'G2', 'C3'],
        ['G2', 'R', 'D3', 'R'],
        ['G2', 'R', 'B2', 'D3'],
        ['E2', 'R', 'G2', 'B2'],
        ['C3', 'R', 'E3', 'C3'],
        ['D3', 'R', 'A2', 'D3'],
    ]
    b_chords = [
        ('G3', 'B3', 'D4'),
        ('E3', 'G3', 'B3'),
        ('C4', 'E4', 'G4'),
        ('G3', 'B3', 'D4'),
        ('G3', 'B3', 'D4'),
        ('E3', 'G3', 'B3'),
        ('C4', 'E4', 'G4'),
        ('D3', 'F#3', 'A3'),
    ]

    b_counter = [
        ['R', 'D5', 'R', 'R', 'R', 'D5', 'R', 'R'],
        ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
        ['R', 'G5', 'R', 'R', 'R', 'G5', 'R', 'R'],
        ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
        ['R', 'R', 'G5', 'R', 'R', 'R', 'B5', 'R'],
        ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
        ['R', 'R', 'E5', 'R', 'R', 'E5', 'R', 'R'],
        ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
    ]

    sections = [
        {
            'bars': 16, 'lead': a_lead, 'bass': a_bass, 'chords': a_chords,
            'lead_shape': 'pulse', 'lead_duty': 0.5, 'lead_vol': 0.15,
            'bass_vol': 0.20, 'chord_vol': 0.035,
            'drum_intensity': 0.45, 'swing': 0.15, 'vibrato': 0.004,
        },
        {
            'bars': 16, 'lead': b_lead, 'bass': b_bass, 'chords': b_chords,
            'lead_shape': 'pulse', 'lead_duty': 0.25, 'lead_vol': 0.16,
            'bass_vol': 0.21, 'chord_vol': 0.04,
            'drum_intensity': 0.55, 'swing': 0.2, 'vibrato': 0.005,
            'counter': b_counter, 'counter_duty': 0.125, 'counter_vol': 0.07,
        },
        {
            'bars': 16, 'lead': a_lead, 'bass': a_bass, 'chords': a_chords,
            'lead_shape': 'pulse', 'lead_duty': 0.25, 'lead_vol': 0.16,
            'bass_vol': 0.20, 'chord_vol': 0.04,
            'drum_intensity': 0.50, 'swing': 0.15, 'vibrato': 0.005,
            'lead_duty_sweep': 0.2,
        },
    ]

    render_loop(path, bpm=118.0, bars=48, sections=sections,
                echo_ms=90.0, echo_mix=0.16, lowpass_hz=8000.0)


def compose_game_loop_b(path: Path) -> None:
    """
    Game B (Levels 4-7) — Energetic A minor → C major, adventurous feel.
    More energy, light urgency, still fun.
    ~50 seconds at 124 BPM, 48 bars.
    """
    # A section: Am feel, driving
    a_lead = [
        ['A5', 'R', 'C6', 'R', 'E6', 'R', 'C6', 'A5'],
        ['G5', 'R', 'E5', 'R', 'R', 'R', 'G5', 'A5'],
        ['B5', 'R', 'D6', 'R', 'E6', 'R', 'D6', 'B5'],
        ['A5', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
        ['C6', 'R', 'B5', 'A5', 'R', 'A5', 'B5', 'C6'],
        ['D6', 'R', 'C6', 'R', 'B5', 'R', 'A5', 'R'],
        ['G5', 'R', 'A5', 'B5', 'C6', 'R', 'D6', 'R'],
        ['E6', 'R', 'D6', 'C6', 'R', 'R', 'R', 'R'],
    ]
    a_bass = [
        ['A2', 'R', 'E3', 'A2'],
        ['G2', 'R', 'D3', 'G2'],
        ['B2', 'R', 'F#3', 'B2'],
        ['A2', 'R', 'E3', 'R'],
        ['C3', 'R', 'G2', 'C3'],
        ['D3', 'R', 'A2', 'D3'],
        ['G2', 'R', 'D3', 'G2'],
        ['E3', 'R', 'B2', 'E3'],
    ]
    a_chords = [
        ('A3', 'C4', 'E4'),
        ('G3', 'B3', 'D4'),
        ('B3', 'D4', 'F#4'),
        ('A3', 'C4', 'E4'),
        ('C4', 'E4', 'G4'),
        ('D4', 'F#4', 'A4'),
        ('G3', 'B3', 'D4'),
        ('E3', 'G3', 'B3'),
    ]

    # B section: Resolves to C major, brighter
    b_lead = [
        ['C6', 'R', 'E6', 'R', 'G6', 'R', 'E6', 'C6'],
        ['D6', 'R', 'E6', 'R', 'R', 'R', 'C6', 'D6'],
        ['E6', 'R', 'D6', 'C6', 'R', 'C6', 'D6', 'E6'],
        ['F6', 'R', 'E6', 'D6', 'C6', 'R', 'R', 'R'],
        ['A5', 'R', 'C6', 'R', 'E6', 'R', 'G6', 'R'],
        ['F6', 'R', 'E6', 'R', 'D6', 'R', 'C6', 'R'],
        ['D6', 'R', 'E6', 'F6', 'E6', 'R', 'D6', 'C6'],
        ['C6', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
    ]
    b_bass = [
        ['C3', 'R', 'G2', 'C3'],
        ['D3', 'R', 'A2', 'D3'],
        ['E3', 'R', 'B2', 'E3'],
        ['F2', 'R', 'C3', 'F2'],
        ['A2', 'R', 'E3', 'A2'],
        ['F2', 'R', 'C3', 'F2'],
        ['G2', 'R', 'D3', 'G2'],
        ['C3', 'R', 'G2', 'C3'],
    ]
    b_chords = [
        ('C4', 'E4', 'G4'),
        ('D4', 'F4', 'A4'),
        ('E3', 'G3', 'B3'),
        ('F3', 'A3', 'C4'),
        ('A3', 'C4', 'E4'),
        ('F3', 'A3', 'C4'),
        ('G3', 'B3', 'D4'),
        ('C4', 'E4', 'G4'),
    ]

    b_counter = [
        ['R', 'R', 'G5', 'R', 'R', 'R', 'G5', 'R'],
        ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
        ['R', 'R', 'A5', 'R', 'R', 'R', 'A5', 'R'],
        ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
        ['R', 'E5', 'R', 'R', 'R', 'E5', 'R', 'R'],
        ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
        ['R', 'B4', 'R', 'R', 'D5', 'R', 'R', 'R'],
        ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
    ]

    sections = [
        {
            'bars': 16, 'lead': a_lead, 'bass': a_bass, 'chords': a_chords,
            'lead_shape': 'pulse', 'lead_duty': 0.5, 'lead_vol': 0.16,
            'bass_vol': 0.21, 'chord_vol': 0.035,
            'drum_intensity': 0.60, 'swing': 0.1, 'vibrato': 0.005,
        },
        {
            'bars': 16, 'lead': b_lead, 'bass': b_bass, 'chords': b_chords,
            'lead_shape': 'pulse', 'lead_duty': 0.25, 'lead_vol': 0.17,
            'bass_vol': 0.22, 'chord_vol': 0.04,
            'drum_intensity': 0.70, 'swing': 0.15, 'vibrato': 0.006,
            'counter': b_counter, 'counter_duty': 0.125, 'counter_vol': 0.07,
        },
        {
            'bars': 16, 'lead': a_lead, 'bass': a_bass, 'chords': a_chords,
            'lead_shape': 'pulse', 'lead_duty': 0.25, 'lead_vol': 0.17,
            'bass_vol': 0.22, 'chord_vol': 0.04,
            'drum_intensity': 0.65, 'swing': 0.1, 'vibrato': 0.006,
            'lead_duty_sweep': 0.2,
        },
    ]

    render_loop(path, bpm=124.0, bars=48, sections=sections,
                echo_ms=85.0, echo_mix=0.15, lowpass_hz=8500.0,
                intensity_curve='wave')


def compose_game_loop_c(path: Path) -> None:
    """
    Game C (Levels 8-10) — Driving, heroic D major with climactic energy.
    Heroic, determined, boss-fight energy but never scary.
    ~48 seconds at 132 BPM, 48 bars.
    """
    # A section: Heroic D major
    a_lead = [
        ['D6', 'R', 'E6', 'F#6', 'R', 'E6', 'D6', 'R'],
        ['A5', 'R', 'D6', 'R', 'R', 'R', 'R', 'R'],
        ['F#6', 'R', 'E6', 'D6', 'R', 'D6', 'E6', 'F#6'],
        ['G6', 'R', 'F#6', 'E6', 'D6', 'R', 'R', 'R'],
        ['A5', 'R', 'D6', 'R', 'F#6', 'R', 'A6', 'R'],
        ['G6', 'R', 'F#6', 'R', 'E6', 'R', 'D6', 'R'],
        ['E6', 'R', 'F#6', 'G6', 'F#6', 'R', 'E6', 'D6'],
        ['D6', 'R', 'R', 'R', 'R', 'R', 'A5', 'D6'],
    ]
    a_bass = [
        ['D3', 'R', 'A2', 'D3'],
        ['D3', 'R', 'F#2', 'A2'],
        ['B2', 'R', 'F#3', 'B2'],
        ['G2', 'R', 'D3', 'G2'],
        ['D3', 'R', 'A2', 'D3'],
        ['G2', 'R', 'D3', 'G2'],
        ['A2', 'R', 'E3', 'A2'],
        ['D3', 'R', 'A2', 'D3'],
    ]
    a_chords = [
        ('D4', 'F#4', 'A4'),
        ('D4', 'F#4', 'A4'),
        ('B3', 'D4', 'F#4'),
        ('G3', 'B3', 'D4'),
        ('D4', 'F#4', 'A4'),
        ('G3', 'B3', 'D4'),
        ('A3', 'C#4', 'E4'),
        ('D4', 'F#4', 'A4'),
    ]

    # B section: Even more heroic, climactic
    b_lead = [
        ['A6', 'R', 'F#6', 'R', 'D6', 'R', 'F#6', 'A6'],
        ['G6', 'R', 'F#6', 'E6', 'D6', 'R', 'E6', 'F#6'],
        ['G6', 'R', 'A6', 'R', 'G6', 'R', 'F#6', 'E6'],
        ['D6', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
        ['D6', 'R', 'E6', 'F#6', 'G6', 'R', 'A6', 'R'],
        ['B6', 'R', 'A6', 'R', 'G6', 'R', 'F#6', 'R'],
        ['E6', 'R', 'F#6', 'G6', 'A6', 'R', 'G6', 'F#6'],
        ['D6', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
    ]
    b_bass = [
        ['D3', 'R', 'A2', 'F#2'],
        ['G2', 'R', 'D3', 'B2'],
        ['G2', 'R', 'D3', 'G2'],
        ['D3', 'R', 'A2', 'D3'],
        ['D3', 'R', 'A2', 'D3'],
        ['G2', 'R', 'D3', 'B2'],
        ['A2', 'R', 'E3', 'A2'],
        ['D3', 'D3', 'A2', 'D3'],
    ]
    b_chords = [
        ('D4', 'F#4', 'A4'),
        ('G3', 'B3', 'D4'),
        ('G3', 'B3', 'D4'),
        ('D4', 'F#4', 'A4'),
        ('D4', 'F#4', 'A4'),
        ('G3', 'B3', 'D4'),
        ('A3', 'C#4', 'E4'),
        ('D4', 'F#4', 'A4'),
    ]

    b_counter = [
        ['R', 'R', 'A5', 'R', 'R', 'A5', 'R', 'R'],
        ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
        ['R', 'R', 'B5', 'R', 'R', 'B5', 'R', 'R'],
        ['R', 'R', 'R', 'R', 'R', 'R', 'A5', 'D6'],
        ['R', 'R', 'R', 'F#5', 'R', 'R', 'R', 'R'],
        ['R', 'R', 'D5', 'R', 'R', 'R', 'D5', 'R'],
        ['R', 'R', 'R', 'R', 'E5', 'R', 'R', 'R'],
        ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
    ]

    # C section: Final push — even higher energy
    c_lead = [
        ['F#6', 'R', 'G6', 'A6', 'R', 'A6', 'G6', 'F#6'],
        ['E6', 'R', 'F#6', 'R', 'D6', 'R', 'R', 'R'],
        ['A6', 'R', 'G6', 'F#6', 'E6', 'R', 'F#6', 'G6'],
        ['A6', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
        ['D6', 'E6', 'F#6', 'G6', 'A6', 'R', 'G6', 'F#6'],
        ['E6', 'R', 'F#6', 'G6', 'F#6', 'R', 'E6', 'D6'],
        ['A5', 'R', 'D6', 'R', 'F#6', 'R', 'A6', 'R'],
        ['D6', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
    ]

    sections = [
        {
            'bars': 16, 'lead': a_lead, 'bass': a_bass, 'chords': a_chords,
            'lead_shape': 'pulse', 'lead_duty': 0.5, 'lead_vol': 0.17,
            'bass_vol': 0.22, 'chord_vol': 0.04,
            'drum_intensity': 0.70, 'swing': 0.05, 'vibrato': 0.005,
        },
        {
            'bars': 16, 'lead': b_lead, 'bass': b_bass, 'chords': b_chords,
            'lead_shape': 'pulse', 'lead_duty': 0.25, 'lead_vol': 0.18,
            'bass_vol': 0.23, 'chord_vol': 0.045,
            'drum_intensity': 0.80, 'swing': 0.05, 'vibrato': 0.006,
            'counter': b_counter, 'counter_duty': 0.25, 'counter_vol': 0.08,
        },
        {
            'bars': 16, 'lead': c_lead, 'bass': a_bass, 'chords': a_chords,
            'lead_shape': 'pulse', 'lead_duty': 0.5, 'lead_vol': 0.19,
            'bass_vol': 0.23, 'chord_vol': 0.045,
            'drum_intensity': 0.85, 'swing': 0.0, 'vibrato': 0.006,
            'lead_duty_sweep': -0.2,
        },
    ]

    render_loop(path, bpm=132.0, bars=48, sections=sections,
                echo_ms=80.0, echo_mix=0.14, lowpass_hz=9000.0,
                intensity_curve='rise')


# ---------------------------------------------------------------------------
# Stingers
# ---------------------------------------------------------------------------

def render_stinger(
    path: Path, notes: list[str], step_s: float,
    shape: str = 'pulse', vol: float = 0.23, duty: float = 0.5,
    final_hold: float = 0.3
) -> None:
    """Render a short stinger/jingle with echo and filtering."""
    total = max(0.3, len(notes) * step_s + final_hold + 0.15)
    buf = make_buffer(total)
    t = 0.0
    for i, note in enumerate(notes):
        if note != 'R':
            is_last = (i == len(notes) - 1)
            dur = (step_s * 0.85) if not is_last else final_hold
            v = vol * (1.1 if is_last else 1.0)
            add_tone(buf, t, dur, hz(note), shape=shape, vol=v, duty=duty,
                     vibrato_depth=0.003, vibrato_hz=5.0,
                     attack=0.003, decay=0.04, sustain=0.8, release=0.08)
        t += step_s

    # Light echo on stingers
    apply_echo(buf, delay_ms=70.0, mix=0.12, feedback=0.15)
    apply_lowpass(buf, 7000.0)
    write_wav(path, buf)


def render_level_clear(path: Path) -> None:
    """Victory fanfare — triumphant, uses core motif (C-E-G-C-E)."""
    total = 1.6
    buf = make_buffer(total)
    # Core motif ascending: C5 E5 G5 C6 — then flourish
    motif = [
        ('C5', 0.0, 0.12),
        ('E5', 0.11, 0.12),
        ('G5', 0.22, 0.15),
        ('C6', 0.38, 0.25),
        ('E6', 0.64, 0.45),
    ]
    for note, start, dur in motif:
        add_tone(buf, start, dur, hz(note), shape='pulse', vol=0.22, duty=0.5,
                 vibrato_depth=0.004, vibrato_hz=5.5, vibrato_delay=0.1,
                 attack=0.005, decay=0.05, sustain=0.8, release=0.1)

    # Harmony underneath
    add_tone(buf, 0.38, 0.7, hz('G4'), shape='pulse', vol=0.10, duty=0.25,
             attack=0.01, decay=0.05, sustain=0.6, release=0.15)
    add_tone(buf, 0.38, 0.7, hz('E4'), shape='triangle', vol=0.08,
             attack=0.01, decay=0.05, sustain=0.5, release=0.15)

    # Bass note
    add_tone(buf, 0.35, 0.8, hz('C3'), shape='triangle', vol=0.15,
             attack=0.01, decay=0.1, sustain=0.5, release=0.2)

    # Celebratory noise burst
    add_noise(buf, 0.35, 0.15, 0.06, seed=777, tilt_hz=3000.0,
              attack=0.001, decay=0.02, sustain=0.2, release=0.05)

    apply_echo(buf, delay_ms=80.0, mix=0.15, feedback=0.2)
    apply_lowpass(buf, 7500.0)
    write_wav(path, buf)


def render_level_fail(path: Path) -> None:
    """Gentle wind-down — warm, not scary. "We'll get 'em next time." """
    total = 0.9
    buf = make_buffer(total)
    # Gentle descending phrase — warm triangle timbre
    notes = [('E5', 0.0, 0.18), ('D5', 0.16, 0.18),
             ('C5', 0.32, 0.22), ('A4', 0.52, 0.30)]
    for note, start, dur in notes:
        add_tone(buf, start, dur, hz(note), shape='triangle', vol=0.18,
                 vibrato_depth=0.003, vibrato_hz=4.0,
                 attack=0.01, decay=0.05, sustain=0.65, release=0.1)
    # Soft pad
    add_tone(buf, 0.0, 0.8, hz('A3'), shape='sine', vol=0.06,
             attack=0.05, decay=0.1, sustain=0.4, release=0.2)
    apply_echo(buf, delay_ms=120.0, mix=0.20, feedback=0.3)
    apply_lowpass(buf, 5000.0)
    write_wav(path, buf)


def render_boss_end(path: Path) -> None:
    """Boss defeated — short victory punch."""
    total = 0.7
    buf = make_buffer(total)
    notes = [('G4', 0.0, 0.1), ('B4', 0.09, 0.1),
             ('D5', 0.18, 0.12), ('G5', 0.30, 0.30)]
    for note, start, dur in notes:
        add_tone(buf, start, dur, hz(note), shape='pulse', vol=0.22, duty=0.5,
                 vibrato_depth=0.003, vibrato_hz=5.0,
                 attack=0.003, decay=0.04, sustain=0.75, release=0.08)
    # Bass punch
    add_tone(buf, 0.28, 0.35, hz('G3'), shape='triangle', vol=0.14,
             attack=0.005, decay=0.08, sustain=0.5, release=0.15)
    apply_echo(buf, delay_ms=75.0, mix=0.14, feedback=0.2)
    apply_lowpass(buf, 7000.0)
    write_wav(path, buf)


# ---------------------------------------------------------------------------
# SFX rendering
# ---------------------------------------------------------------------------

def render_ui_click(path: Path) -> None:
    """Short, clean blip. ~60ms."""
    buf = make_buffer(0.10)
    add_tone(buf, 0.0, 0.055, 1200.0, shape='pulse', vol=0.18, duty=0.25,
             attack=0.001, decay=0.015, sustain=0.4, release=0.02)
    apply_lowpass(buf, 6000.0)
    write_wav(path, buf)


def render_ui_confirm(path: Path) -> None:
    """Brighter rising blip. ~90ms."""
    buf = make_buffer(0.14)
    add_chirp(buf, 0.0, 0.08, 700.0, 1400.0, shape='pulse', vol=0.20, duty=0.25)
    apply_lowpass(buf, 7000.0)
    write_wav(path, buf)


def render_ui_back(path: Path) -> None:
    """Descending blip. ~90ms."""
    buf = make_buffer(0.14)
    add_chirp(buf, 0.0, 0.08, 1200.0, 600.0, shape='pulse', vol=0.19, duty=0.25)
    apply_lowpass(buf, 7000.0)
    write_wav(path, buf)


def render_ui_toggle_on(path: Path) -> None:
    """Rising two-note chirp. ~110ms."""
    buf = make_buffer(0.16)
    add_tone(buf, 0.0, 0.05, 600.0, shape='pulse', vol=0.20, duty=0.5,
             attack=0.002, decay=0.01, sustain=0.6, release=0.02)
    add_tone(buf, 0.05, 0.06, 900.0, shape='pulse', vol=0.22, duty=0.5,
             attack=0.002, decay=0.01, sustain=0.6, release=0.02)
    apply_lowpass(buf, 6500.0)
    write_wav(path, buf)


def render_ui_toggle_off(path: Path) -> None:
    """Falling two-note chirp. ~110ms."""
    buf = make_buffer(0.16)
    add_tone(buf, 0.0, 0.05, 900.0, shape='pulse', vol=0.20, duty=0.5,
             attack=0.002, decay=0.01, sustain=0.6, release=0.02)
    add_tone(buf, 0.05, 0.06, 500.0, shape='pulse', vol=0.18, duty=0.5,
             attack=0.002, decay=0.01, sustain=0.5, release=0.02)
    apply_lowpass(buf, 6500.0)
    write_wav(path, buf)


def render_spray(path: Path, seed: int, bright: float) -> None:
    """Water burst — punchy, satisfying, with tonal component."""
    buf = make_buffer(0.25)
    # Noise burst for water texture
    add_noise(buf, 0.0, 0.18, vol=0.20, seed=seed, tilt_hz=1200.0 + bright * 600.0,
              attack=0.002, decay=0.04, sustain=0.35, release=0.06)
    # Tonal whoosh component
    add_chirp(buf, 0.005, 0.15, 1600.0 + bright * 300.0, 500.0,
              shape='triangle', vol=0.12)
    # Punch — short low burst
    add_kick(buf, 0.0, 0.08, pitch=200.0, decay_time=0.08)
    apply_lowpass(buf, 8000.0)
    write_wav(path, buf)


def render_hit_success(path: Path, notes: tuple[str, str, str], vol: float) -> None:
    """Bright rising 2-3 note chime. Clear positive feedback."""
    buf = make_buffer(0.30)
    add_tone(buf, 0.0, 0.09, hz(notes[0]), shape='pulse', vol=vol, duty=0.25,
             attack=0.002, decay=0.02, sustain=0.7, release=0.04)
    add_tone(buf, 0.08, 0.09, hz(notes[1]), shape='pulse', vol=vol * 0.95, duty=0.25,
             attack=0.002, decay=0.02, sustain=0.7, release=0.04)
    add_tone(buf, 0.16, 0.12, hz(notes[2]), shape='triangle', vol=vol * 0.9,
             attack=0.002, decay=0.03, sustain=0.65, release=0.06)
    apply_echo(buf, delay_ms=50.0, mix=0.10, feedback=0.1)
    apply_lowpass(buf, 7000.0)
    write_wav(path, buf)


def render_hit_minor(path: Path) -> None:
    """Softer single-note acknowledgment. Still positive."""
    buf = make_buffer(0.20)
    add_tone(buf, 0.0, 0.15, hz('A4'), shape='triangle', vol=0.17,
             vibrato_depth=0.002, vibrato_hz=4.5,
             attack=0.005, decay=0.04, sustain=0.55, release=0.06)
    # Slight harmonic for warmth
    add_tone(buf, 0.0, 0.12, hz('E5'), shape='sine', vol=0.05,
             attack=0.01, decay=0.04, sustain=0.3, release=0.04)
    apply_lowpass(buf, 5500.0)
    write_wav(path, buf)


def render_fail(path: Path, notes: tuple[str, str], vol: float) -> None:
    """Gentle descending two-note phrase. Warm, not harsh."""
    buf = make_buffer(0.35)
    # Use triangle wave for warmth (spec says no saw/buzz)
    add_tone(buf, 0.0, 0.15, hz(notes[0]), shape='triangle', vol=vol,
             attack=0.008, decay=0.04, sustain=0.6, release=0.06)
    add_tone(buf, 0.14, 0.18, hz(notes[1]), shape='triangle', vol=vol * 0.85,
             attack=0.008, decay=0.04, sustain=0.5, release=0.08)
    apply_lowpass(buf, 4500.0)
    write_wav(path, buf)


def render_word_mastered(path: Path) -> None:
    """Bright ascending arpeggio — "item collected" feeling."""
    buf = make_buffer(0.50)
    notes = ['C5', 'E5', 'G5', 'C6']
    t = 0.0
    for i, note in enumerate(notes):
        vol = 0.19 + 0.02 * i  # Crescendo
        dur = 0.10 if i < 3 else 0.18
        add_tone(buf, t, dur, hz(note), shape='pulse', vol=vol, duty=0.25,
                 vibrato_depth=0.003, vibrato_hz=5.0,
                 attack=0.003, decay=0.03, sustain=0.7, release=0.05)
        t += 0.09
    apply_echo(buf, delay_ms=60.0, mix=0.12, feedback=0.15)
    apply_lowpass(buf, 7000.0)
    write_wav(path, buf)


def render_unlock_reward(path: Path) -> None:
    """Ascending flourish — "achievement" or "door opening" feeling."""
    buf = make_buffer(0.70)
    notes = ['G4', 'B4', 'D5', 'G5', 'B5']
    t = 0.0
    for i, note in enumerate(notes):
        vol = 0.18 + 0.015 * i
        dur = 0.11 if i < 4 else 0.25
        add_tone(buf, t, dur, hz(note), shape='pulse', vol=vol, duty=0.5,
                 vibrato_depth=0.003, vibrato_hz=5.2,
                 attack=0.003, decay=0.04, sustain=0.7, release=0.06)
        t += 0.10
    # Low harmony on final note
    add_tone(buf, 0.40, 0.25, hz('G3'), shape='triangle', vol=0.10,
             attack=0.01, decay=0.05, sustain=0.5, release=0.1)
    apply_echo(buf, delay_ms=70.0, mix=0.13, feedback=0.15)
    apply_lowpass(buf, 7000.0)
    write_wav(path, buf)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    import shutil

    out = Path('assets/audio')
    music = out / 'music'
    sfx = out / 'sfx'
    music.mkdir(parents=True, exist_ok=True)
    sfx.mkdir(parents=True, exist_ok=True)

    print('Generating music loops...')
    compose_menu_loop(music / 'bgm_menu_loop.wav')
    compose_game_loop_a(music / 'bgm_game_loop_a.wav')
    compose_game_loop_b(music / 'bgm_game_loop_b.wav')
    compose_game_loop_c(music / 'bgm_game_loop_c.wav')

    print('Generating stingers...')
    render_level_clear(music / 'stinger_level_clear.wav')
    render_level_fail(music / 'stinger_level_fail.wav')
    render_boss_end(music / 'stinger_boss_end.wav')

    print('Generating UI sounds...')
    render_ui_click(sfx / 'ui_click_v01.wav')
    render_ui_confirm(sfx / 'ui_confirm_v01.wav')
    render_ui_back(sfx / 'ui_back_v01.wav')
    render_ui_toggle_on(sfx / 'ui_toggle_on_v01.wav')
    render_ui_toggle_off(sfx / 'ui_toggle_off_v01.wav')

    print('Generating gameplay SFX...')
    render_spray(sfx / 'spray_shot_v01.wav', seed=42, bright=0.3)
    render_spray(sfx / 'spray_shot_v02.wav', seed=137, bright=0.7)
    render_hit_success(sfx / 'hit_success_v01.wav', ('C5', 'E5', 'G5'), vol=0.22)
    render_hit_success(sfx / 'hit_success_v02.wav', ('D5', 'F#5', 'A5'), vol=0.22)
    render_hit_minor(sfx / 'hit_minor_v01.wav')
    render_fail(sfx / 'fail_try_again_v01.wav', ('E5', 'C5'), vol=0.18)
    render_fail(sfx / 'fail_try_again_v02.wav', ('D5', 'B4'), vol=0.18)

    print('Generating progress SFX...')
    render_word_mastered(sfx / 'word_mastered_v01.wav')
    render_unlock_reward(sfx / 'unlock_reward_v01.wav')

    # Legacy fallbacks
    print('Copying legacy fallbacks...')
    shutil.copy2(music / 'bgm_menu_loop.wav', out / 'bgm.wav')
    shutil.copy2(sfx / 'spray_shot_v01.wav', out / 'spray.wav')
    shutil.copy2(sfx / 'hit_success_v01.wav', out / 'hit.wav')
    shutil.copy2(sfx / 'fail_try_again_v01.wav', out / 'fail.wav')
    shutil.copy2(music / 'stinger_level_clear.wav', out / 'victory.wav')

    # Verify all 26 files
    expected = [
        out / 'bgm.wav', out / 'spray.wav', out / 'hit.wav',
        out / 'fail.wav', out / 'victory.wav',
        music / 'bgm_menu_loop.wav', music / 'bgm_game_loop_a.wav',
        music / 'bgm_game_loop_b.wav', music / 'bgm_game_loop_c.wav',
        music / 'stinger_level_clear.wav', music / 'stinger_level_fail.wav',
        music / 'stinger_boss_end.wav',
        sfx / 'ui_click_v01.wav', sfx / 'ui_confirm_v01.wav',
        sfx / 'ui_back_v01.wav', sfx / 'ui_toggle_on_v01.wav',
        sfx / 'ui_toggle_off_v01.wav',
        sfx / 'spray_shot_v01.wav', sfx / 'spray_shot_v02.wav',
        sfx / 'hit_success_v01.wav', sfx / 'hit_success_v02.wav',
        sfx / 'hit_minor_v01.wav',
        sfx / 'fail_try_again_v01.wav', sfx / 'fail_try_again_v02.wav',
        sfx / 'word_mastered_v01.wav', sfx / 'unlock_reward_v01.wav',
    ]

    print(f'\nVerifying {len(expected)} audio files...')
    missing = [p for p in expected if not p.exists()]
    if missing:
        print(f'ERROR: Missing {len(missing)} files:')
        for p in missing:
            print(f'  {p}')
    else:
        print(f'All {len(expected)} audio files verified!')


if __name__ == '__main__':
    main()
