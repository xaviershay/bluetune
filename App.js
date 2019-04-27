/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { NativeModules } from "react-native";

type Props = {};
type State = {|
  interval: string,
  stage: string,
  baseNote: string,
  replayNextEnabled: boolean,
  revealOpacity: Animated.Value,
  version: number
|};

const makeInterval = (name, semitones) => {
  return {
    name: name,
    semitones: semitones
  };
};

const INTERVALS = {
  "2m": makeInterval("Minor 2nd", 1),
  "2M": makeInterval("Major 2nd", 2),
  "3m": makeInterval("Minor 3rd", 3),
  "3M": makeInterval("Major 3rd", 4),
  "4P": makeInterval("Perfect 4th", 5),
  "4T": makeInterval("Tritone", 6),
  "5P": makeInterval("Perfect 5th", 7),
  "6m": makeInterval("Minor 6th", 8),
  "6M": makeInterval("Major 6th", 9),
  "7m": makeInterval("Minor 7th", 10),
  "7M": makeInterval("Major 7th", 11),
  "8P": makeInterval("Octave", 12)
};

const SCALE = [
  "c2",
  "db2",
  "d2",
  "eb2",
  "e2",
  "f2",
  "fs2",
  "g2",
  "ab2",
  "a2",
  "bb2",
  "b2",
  "c3",
  "db3",
  "d3",
  "eb3",
  "e3",
  "f3",
  "fs3",
  "g3",
  "ab3",
  "a3",
  "bb3",
  "b3",
  "c4",
  "db4",
  "d4",
  "eb4",
  "e4",
  "f4",
  "fs4",
  "g4",
  "ab4",
  "a4",
  "bb4",
  "b4"
];
class Note {
  static create(resourceId) {
    return NativeModules.NativeAudioManager.prepare(resourceId).then(
      playerId => new PreparedNote(playerId)
    );
  }
}

class PreparedNote {
  _resourceId: string;

  constructor(resourceId) {
    this._resourceId = resourceId;
  }

  destroy() {
    return NativeModules.NativeAudioManager.destroy(this._resourceId);
  }

  play(): PlayingNote {
    return new PlayingNote(
      this._resourceId,
      NativeModules.NativeAudioManager.play(this._resourceId)
    );
  }
}

class PlayingNote {
  _resourceId: string;
  _promise: Promise<void>;

  constructor(resourceId, promise) {
    this._resourceId = resourceId;
    this._promise = promise;
  }

  stop() {
    return NativeModules.NativeAudioManager.stopAndReset(this._resourceId).then(
      () => new StoppedNote(this._resourceId)
    );
  }
}

class StoppedNote {
  _resourceId: string;

  constructor(resourceId) {
    this._resourceId = resourceId;
  }

  destroy() {
    return NativeModules.NativeAudioManager.destroy(this._resourceId);
  }
}

export default class App extends React.PureComponent<Props, State> {
  state = {
    interval: "2m",
    baseNote: "c2",
    stage: "splash",
    replayNextEnabled: false,
    revealOpacity: new Animated.Value(0),
    version: 0
  };

  playing: Array<PlayingNote>;

  constructor(props: Props) {
    super(props);
    const possibleIntervals = Object.keys(INTERVALS);
    const n = Math.floor(Math.random() * possibleIntervals.length);

    this.state.interval = possibleIntervals[n];
    this.playing = [];
  }

  componentWillUnmount() {
    this.playing.forEach(x => x.stop().then(x => x.destroy()));
  }

  transitionGuess = () => {
    const possibleIntervals = Object.keys(INTERVALS);
    const n = Math.floor(Math.random() * possibleIntervals.length);

    // Generate a new test
    const interval = INTERVALS[possibleIntervals[n]];
    const baseIndex = Math.floor(
      Math.random() * (SCALE.length - interval.semitones)
    );

    this.setState(
      {
        interval: possibleIntervals[n],
        baseNote: SCALE[baseIndex],
        stage: "guess",
        replayNextEnabled: false
      },
      this.playInterval
    );

    this.state.revealOpacity.setValue(0);
  };

  transitionReveal = () => {
    if (this.state.replayNextEnabled) {
      this.setState({ stage: "reveal" });
    }
  };

  playInterval = async () => {
    const version = this.state.version + 1;
    const interval = INTERVALS[this.state.interval];

    const baseNote = this.state.baseNote;
    const baseIndex = SCALE.indexOf(baseNote);
    const secondNote = SCALE[baseIndex + interval.semitones];

    const notesToPlay: Array<PreparedNote> = await Promise.all([
      Note.create(baseNote),
      Note.create(secondNote)
    ]);

    this.setState({ version: version });

    await Promise.all(
      this.playing.map(playingNote => playingNote.stop().then(x => x.destroy()))
    );

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    this.playing = [];

    // Protect against continuing to play notes if a new interval has started playing.
    const play = note => {
      if (version === this.state.version) {
        this.playing.push(note.play());
      } else {
        note.destroy();
      }
    };

    play(notesToPlay[0]);
    await wait(1000);
    play(notesToPlay[1]);

    this.setState({ replayNextEnabled: true });
    Animated.timing(this.state.revealOpacity, {
      toValue: 1,
      duration: 750
    }).start();
  };

  render() {
    const stage = this.state.stage;
    const showReplay = stage === "guess" || stage === "reveal";

    return (
      <View style={styles.container}>
        {stage === "splash" && this.renderSplash()}
        {stage === "loading" && this.renderLoading()}
        {stage === "guess" && this.renderGuess()}
        {stage === "reveal" && this.renderReveal()}
        {showReplay && (
          <Animated.View style={{ opacity: this.state.revealOpacity }}>
            <TouchableOpacity
              onPress={this.playInterval}
              disabled={!this.state.replayNextEnabled}
              style={{
                backgroundColor: "#2196F3",
                padding: 10
              }}
            >
              <Text style={styles.label}>Replay</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    );
  }

  renderLoading = () => {
    return (
      <Text style={[{ flex: 1, fontSize: 32 }, styles.instructions]}>
        Loading...
      </Text>
    );
  };

  renderSplash = () => {
    return (
      <TouchableOpacity
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center"
        }}
        onPress={this.transitionGuess}
      >
        <Text style={[{ flex: 1 }, styles.label]}>🎵 Tap to start 🎶</Text>
      </TouchableOpacity>
    );
  };

  renderGuess = () => {
    return (
      <TouchableOpacity
        style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
        onPress={this.transitionReveal}
      >
        <Animated.View style={{ flex: 1, opacity: this.state.revealOpacity }}>
          <Text style={styles.label}>Tap to reveal</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  renderReveal = () => {
    return (
      <TouchableOpacity
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center"
        }}
        onPress={this.transitionGuess}
      >
        <Text style={[{ flex: 1 }, styles.label]}>
          {INTERVALS[this.state.interval].name}
        </Text>
      </TouchableOpacity>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black"
  },
  label: {
    fontSize: 32,
    color: "white",
    padding: 5,
    textAlign: "center"
  },
  instructions: {
    textAlign: "center",
    color: "white",
    marginBottom: 5
  }
});
