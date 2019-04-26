/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Player } from "react-native-audio-toolkit";

type Props = {};
type State = {|
  interval: string,
  stage: string,
  baseNote: string
|};

const makeInterval = (name, semitones) => {
  return {
    name: name,
    semitones: semitones
  };
};

// TODO: These intervals are wrong, just for testing.
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

export default class App extends React.PureComponent<Props, State> {
  state = {
    interval: "2m",
    baseNote: "c2",
    stage: "splash"
  };

  notes: { [string]: Player };

  constructor(props: Props) {
    super(props);
    const possibleIntervals = Object.keys(INTERVALS);
    const n = Math.floor(Math.random() * possibleIntervals.length);

    this.state.interval = possibleIntervals[n];
  }

  componentDidMount() {
    this.notes = {};
    SCALE.forEach(note => {
      this.notes[note] = new Player(note + ".mp3", { autoDestroy: false });
      this.notes[note].prepare();
    });
  }

  componentWillUnmount() {
    this.notes.forEach(x => x.destroy());
  }

  transitionGuess = () => {
    // Generate a new test
    const interval = INTERVALS[this.state.interval];
    const baseIndex = Math.floor(
      Math.random() * (SCALE.length - interval.semitones)
    );
    const possibleIntervals = Object.keys(INTERVALS);
    const n = Math.floor(Math.random() * possibleIntervals.length);

    this.setState({
      interval: possibleIntervals[n],
      baseNote: SCALE[baseIndex],
      stage: "guess"
    });

    // TODO: Stop playing notes
    // TODO: Play interval
    this.playInterval();
  };

  transitionReveal = () => {
    this.setState({ stage: "reveal" });
  };

  playInterval = () => {
    const interval = INTERVALS[this.state.interval];

    const baseNote = this.state.baseNote;
    const baseIndex = SCALE.indexOf(baseNote);
    const secondNote = SCALE[baseIndex + interval.semitones];

    this.notes[baseNote].seek(0, () =>
      this.notes[baseNote].play(() =>
        setTimeout(
          () =>
            this.notes[secondNote].seek(0, () => this.notes[secondNote].play()),
          1000
        )
      )
    );
  };

  render() {
    switch (this.state.stage) {
      case "splash":
        return this.renderSplash();
      case "guess":
        return this.renderGuess();
      case "reveal":
        return this.renderReveal();
      default:
        return <Text>Something went wrong :(</Text>;
    }
  }

  renderSplash = () => {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center"
          }}
          onPress={this.transitionGuess}
        >
          <Text style={[{ flex: 1, fontSize: 32 }, styles.instructions]}>
            🎵 Tap to start 🎶
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  renderGuess = () => {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={{ flex: 1, justifyContent: "space-between" }}
          onPress={() => {
            this.setState({ stage: "reveal" });
          }}
        >
          <Text style={[{ paddingTop: 32, fontSize: 32 }, styles.instructions]}>
            Tap to reveal
          </Text>
          <Button title="Replay" onPress={this.playInterval} />
        </TouchableOpacity>
      </View>
    );
  };

  renderReveal = () => {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center"
          }}
          onPress={this.transitionGuess}
        >
          <Text style={[{ flex: 1, fontSize: 32 }, styles.instructions]}>
            {INTERVALS[this.state.interval].name}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "white",
    marginBottom: 5
  }
});
