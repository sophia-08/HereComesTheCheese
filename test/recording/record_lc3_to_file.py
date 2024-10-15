import os
import sys
import serial
import logging
import argparse

logging.basicConfig(level=logging.INFO)

commands = [b"", b"rec_ok", b"init_ok", b"fi"]

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

            raw_data = []
            recording = False

            while True:
                recv = ser.readline().rstrip()
                
                if recv == b"rec_ok":
                    logging.info('Start receive')
                    recording = True
                elif recv == b"fi":
                    logging.info('Finish receive')
                    break
                elif recording and recv not in commands:
                    raw_data.append(recv)
                    raw_data.append(b'\n')
                
            if raw_data:
                logging.info("Writing file")
                filename = f"{args.filename}_{i}{args.extension}"
                write_compressed_data(raw_data, filename)
                i += 1
            else:
                logging.info("No data received between 'rec_ok' and 'fi'")

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