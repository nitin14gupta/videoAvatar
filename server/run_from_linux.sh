#!/bin/bash
# Script to run server from Linux with MuseTalk conda environment

# Activate MuseTalk conda environment
source ~/anaconda3/etc/profile.d/conda.sh  # Adjust path if needed
conda activate MuseTalk

# Navigate to server directory
cd /mnt/c/Project/videoAvatar/server

# Install server dependencies if not already installed
pip install -r requirements.txt

# Run server
python main.py

