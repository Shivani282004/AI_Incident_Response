import time

memory_hog = []

while True:
    memory_hog.extend([0] * 10**6) 
    print("Still running... memory increasing.")
    time.sleep(1)
