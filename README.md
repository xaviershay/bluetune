## Aural Trainer

A very WIP react-native app to help with aural training.

### Helpul things

Developing

    adb reverse tcp:8081 tcp:8081
    yarn run react-native run-android

Encoding test sounds from http://theremin.music.uiowa.edu/MISpiano.html

    ffmpeg -i ~/Downloads/Piano.mf.G4.aiff -f mp3 -acodec libmp3lame -ab 192000 -ar 44100 g4.mp3