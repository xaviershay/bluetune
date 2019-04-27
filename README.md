## Aural Trainer

A very WIP react-native app to help with aural training.

TODO: Try it on iOS, currently only developing on Android.

### Helpul things

Developing

    adb reverse tcp:8081 tcp:8081
    yarn run react-native run-android

Encoding test sounds from http://theremin.music.uiowa.edu/MISpiano.html

    ffmpeg -i ~/Downloads/Piano.mf.G4.aiff -f mp3 -acodec libmp3lame -ab 192000 -ar 44100 g4.mp3

Some good free piano sound fonts (using "Nice Stienway" currently): https://sites.google.com/site/soundfonts4u/

See `generate_midi.js` and `midi2mp3` in root directory to generate note mp3s using a soundfont.

Handy ADB commands:

    adb shell input text "RR"              # Reload
    adb shell input keyevent KEYCODE_MENU  # Show debug menu