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
  stage: string
|};

const makeInterval = (name, semitones) => {
  return {
    name: name,
    semitones: semitones
  };
};
const INTERVALS = {
  "maj-2": makeInterval("Major 2nd", 2),
  "maj-3": makeInterval("Major 3rd", 4)
};
export default class App extends React.PureComponent<Props, State> {
  state = {
    interval: "maj-3",
    stage: "guess"
  };

  notes: Array<Player>;

  constructor(props: Props) {
    super(props);
    const possibleIntervals = Object.keys(INTERVALS);
    const n = Math.floor(Math.random() * possibleIntervals.length);

    this.state.interval = possibleIntervals[n];
  }
  componentDidMount() {
    this.notes = [
      new Player("f4.mp3", { autoDestroy: false }),
      new Player("g4.mp3", { autoDestroy: false }),
      new Player("a4.mp3", { autoDestroy: false })
    ];
    this.notes.forEach(x => x.prepare());
  }

  componentWillUnmount() {
    this.notes.forEach(x => x.destroy());
  }

  render() {
    if (this.state.stage == "guess") {
      return (
        <View style={styles.container}>
          <TouchableOpacity
            style={{ flex: 1, justifyContent: "space-between" }}
            onPress={() => {
              this.setState({ stage: "reveal" });
            }}
          >
            <Text
              style={[{ paddingTop: 32, fontSize: 32 }, styles.instructions]}
            >
              Tap to reveal
            </Text>
            <Button
              title="Replay"
              onPress={() => {
                const secondNote = this.state.interval == "maj-2" ? 1 : 2;

                this.notes[0].seek(0, () =>
                  this.notes[0].play(() =>
                    setTimeout(
                      () =>
                        this.notes[secondNote].seek(0, () =>
                          this.notes[secondNote].play()
                        ),
                      1000
                    )
                  )
                );
              }}
            />
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.container}>
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center"
            }}
            onPress={() => {
              const possibleIntervals = Object.keys(INTERVALS);
              const n = Math.floor(Math.random() * possibleIntervals.length);

              this.setState({ stage: "guess", interval: possibleIntervals[n] });
            }}
          >
            <Text style={[{ flex: 1, fontSize: 32 }, styles.instructions]}>
              {INTERVALS[this.state.interval].name}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  }
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
