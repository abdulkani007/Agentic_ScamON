import argparse
import sys
from services.sms_collector.collector import SMSCollector

def main():
    parser = argparse.ArgumentParser(description="ScamON AI - Google Messages Web SMS Collector Service")
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Run browser in headless mode (WARNING: Disables visible QR pairing prompt)."
    )
    
    args = parser.parse_args()
    
    # Run headful by default so users can scan the QR code canvas on initial startup
    headful = not args.headless
    
    print("==============================================================")
    print("      ScamON AI - Google Messages Web SMS Collector Service   ")
    print("==============================================================")
    
    collector = SMSCollector(headful=headful)
    try:
        collector.start()
    except KeyboardInterrupt:
        print("\nStopping SMS Collector service.")
        collector.stop()
        sys.exit(0)

if __name__ == "__main__":
    main()
