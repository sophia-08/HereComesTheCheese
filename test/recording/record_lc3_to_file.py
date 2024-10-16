import os
import sys
import serial
import logging
import argparse
import wave, struct

logging.basicConfig(level=logging.INFO)

commands = [b"", b"rec_ok", b"init_ok", b"fi", b"pcm", b"pcm_end", b"lc3", b"lc3_end"]

sampleRate = 16000 # hertz
duration = 3 # seconds

def write_wav_data(raw_sound, filename):
    logging.debug(raw_sound)

    obj = wave.open(filename, 'w')
    obj.setnchannels(1) # mono
    obj.setsampwidth(2)
    obj.setframerate(sampleRate)

    for value in raw_sound:
        try:
            data = struct.pack('<h', value)
            obj.writeframesraw(data)
        except:
            logging.info("wrong ", value)
    obj.close()


def write_compressed_data(raw_data, filename):
    logging.debug(f"Writing {len(raw_data)} bytes to {filename}")
    with open(filename, 'wb') as f:
        for data in raw_data:
            f.write(data)
    logging.info(f"Data written to {filename}")

def main(args):
    i = 1
    ser = serial.Serial(args.port, args.baud_rate, timeout=1)
    logging.info('Awaiting response from device')

    while True: 
        try:
            logging.info('READY') 

            lc3_raw_data = []
            recording_lc3 = False
            raw_sound = []
            recording_sound = False

            while True:
                recv = ser.readline().rstrip()
                
                if recv == b"lc3":
                    logging.info('Start receive lc3')
                    recording_lc3 = True
                elif recv == b"lc3_end":
                    logging.info('Finish receive lc3')
                    recording_lc3 = False
                    break
                if recv == b"pcm":
                    logging.info('Start receive pcm')
                    recording_sound = True
                elif recv == b"pcm_end":
                    logging.info('Finish receive pcm')
                    recording_sound = False
                elif recording_lc3 and recv not in commands:
                    lc3_raw_data.append(recv)
                    lc3_raw_data.append(b'\n')
                elif recording_sound and recv not in commands:
                    raw_sound.append(int(recv))
                    # raw_sound.append(b'\n')
                
            if lc3_raw_data:
                filename = args.filename + str(i) + ".lc3"
                logging.info("Writing "+filename)
                write_compressed_data(lc3_raw_data, filename)
                
            if raw_sound:
                filename = args.filename + str(i) + ".wav"
                logging.info("Writing "+ filename)
                write_wav_data(raw_sound, filename)

            i += 1

        except KeyboardInterrupt:
            logging.info('Exiting script')            
            break

if __name__ == '__main__':
    argparser = argparse.ArgumentParser(
        description='Record and save compressed audio data from device')

    argparser.add_argument(
        '-p',
        '--port',
        default='/dev/cu.usbmodem14601',
        help='port for connection to the device')

    argparser.add_argument(
        '-b',
        '--baud_rate',
        type=int,
        default=115200,
        help='Connection baud rate')

    argparser.add_argument(
        '-n',
        '--filename',
        default='audio',        
        help='Prefix for audio files')

    argparser.add_argument(
        '-e',
        '--extension',
        default='.lc3',        
        help='File extension for the compressed audio (e.g., .lc3)')

    args = argparser.parse_args()

    main(args)