import wave
import speex
import struct

def compress_wav_to_speex(input_wav, output_spx, quality=8):
    # Open the WAV file
    with wave.open(input_wav, 'rb') as wav_file:
        # Get WAV file properties
        channels = wav_file.getnchannels()
        sample_width = wav_file.getsampwidth()
        framerate = wav_file.getframerate()
        n_frames = wav_file.getnframes()

        # Read all frames
        frames = wav_file.readframes(n_frames)

    # Convert frames to a list of integers
    samples = struct.unpack(f"{n_frames * channels}h", frames)

    # Create Speex encoder
    encoder = speex.Encoder()
    encoder.initialize(mode=speex.SPEEX_MODEID_NB)
    encoder.quality = quality

    # Compress the audio data
    compressed_frames = []
    for i in range(0, len(samples), 160):  # Process in chunks of 160 samples
        chunk = samples[i:i+160]
        # Pad the last chunk if necessary
        if len(chunk) < 160:
            chunk = chunk + [0] * (160 - len(chunk))
        compressed = encoder.encode(chunk)
        compressed_frames.append(compressed)

    # Write compressed data to file
    with open(output_spx, 'wb') as spx_file:
        for frame in compressed_frames:
            spx_file.write(frame)

    print(f"Compressed {input_wav} to {output_spx}")

# Usage
input_wav = "sound1.wav"
output_spx = "output.spx"
compress_wav_to_speex(input_wav, output_spx)