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

type NoteName = string;

type Arpeggiation = "up" | "down";

type IntervalTest = {|
  type: "interval",
  name: string,
  arpeggiation: Arpeggiation,
  semitones: number
|};

type Test = IntervalTest;

type Props = {};
type State = {|
  testName: string,
  stage: string,
  baseNote: NoteName,
  replayNextEnabled: boolean,
  revealOpacity: Animated.Value,
  version: number
|};

const allArpeggiations: Array<Arpeggiation> = ["up", "down"];

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

type Map<T> = {
  [key: string]: T
};

// Use native Object.values if it exists
// Otherwise use Object.keys
function values<T>(map: Map<T>): T[] {
  return Object.values
    ? // https://github.com/facebook/flow/issues/2221
      // $FlowFixMe - Object.values currently does not have good flow support
      Object.values(map)
    : Object.keys(map).map((key: string): T => map[key]);
}

type Interval = {|
  name: string,
  semitones: number
|};

function allTests(): { [string]: Test } {
  let tests = {};
  values(INTERVALS).forEach((interval: Interval) => {
    allArpeggiations.forEach(arpeggiation => {
      tests[interval.name + " (" + arpeggiation + ")"] = {
        type: "interval",
        name: interval.name,
        semitones: interval.semitones,
        arpeggiation: arpeggiation
      };
    });
  });
  return tests;
}

const ALL_TESTS = allTests();

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
  static create(resourceId): Promise<PreparedNote> {
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

  destroy(): Promise<void> {
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

  stop(): Promise<StoppedNote> {
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

  destroy(): Promise<void> {
    return NativeModules.NativeAudioManager.destroy(this._resourceId);
  }
}

export default class App extends React.PureComponent<Props, State> {
  state = {
    testName: "Minor 2nd",
    baseNote: "c2",
    stage: "splash",
    replayNextEnabled: false,
    revealOpacity: new Animated.Value(0),
    version: 0
  };

  playing: Array<PlayingNote>;

  constructor(props: Props) {
    super(props);
    this.playing = [];
  }

  componentWillUnmount() {
    this.playing.forEach(x => x.stop().then(x => x.destroy()));
  }

  transitionGuess = () => {
    const possibleTests = Object.keys(ALL_TESTS);
    const n = Math.floor(Math.random() * possibleTests.length);

    // Generate a new test
    const test = ALL_TESTS[possibleTests[n]];
    if (test.type === "interval") {
      // TODO: Handle non-ascending
      const baseIndex = Math.floor(
        Math.random() * (SCALE.length - test.semitones)
      );

      this.setState(
        {
          testName: possibleTests[n],
          baseNote: SCALE[baseIndex],
          stage: "guess",
          replayNextEnabled: false
        },
        this.playInterval
      );

      this.state.revealOpacity.setValue(0);
    } else {
      // Error!
    }
  };

  transitionReveal = () => {
    if (this.state.replayNextEnabled) {
      this.setState({ stage: "reveal" });
    }
  };

  playInterval = async () => {
    const version = this.state.version + 1;
    const test = ALL_TESTS[this.state.testName];

    if (test.type === "interval") {
      const baseNote = this.state.baseNote;
      const baseIndex = SCALE.indexOf(baseNote);
      const secondNote = SCALE[baseIndex + test.semitones];

      let notesToPlay: Array<PreparedNote> = await Promise.all([
        Note.create(baseNote),
        Note.create(secondNote)
      ]);

      this.setState({ version: version });

      await Promise.all(
        this.playing.map(playingNote =>
          playingNote.stop().then(x => x.destroy())
        )
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

      if (test.arpeggiation == "down") notesToPlay = notesToPlay.reverse();
      play(notesToPlay[0]);
      await wait(1000);
      play(notesToPlay[1]);

      this.setState({ replayNextEnabled: true });
      Animated.timing(this.state.revealOpacity, {
        toValue: 1,
        duration: 750
      }).start();
    } else {
      // Error!
    }
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
          {ALL_TESTS[this.state.testName].name}
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
