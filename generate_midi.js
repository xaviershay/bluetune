var MidiWriter = require('midi-writer-js');
const tonal = require('tonal');
const fs = require('fs');

const concat = (x,y) =>
  x.concat(y)

const flatMap = (f,xs) =>
  xs.map(f).reduce(concat, [])

Array.prototype.flatMap = function(f) {
  return flatMap(f,this)
}

makeFilename = (note) => {
  return note.replace("#", "s").toLowerCase()
}

ROOTS = ["C2", "C3", "C4"]
SCALE = ROOTS.flatMap(root => tonal.scale("chromatic").map(tonal.transpose(root)))

SCALE.forEach(noteName => {

  // Start with a new track
  var track = new MidiWriter.Track();

// Define an instrument (optional):
//track.addEvent(new MidiWriter.ProgramChangeEvent({instrument : 1}));
  // Add some notes:
  var note = new MidiWriter.NoteEvent({pitch:[noteName], duration: '2'});
  track.addEvent(note);
  var note = new MidiWriter.NoteEvent({pitch:[noteName], duration: '2', velocity: '1'});
  track.addEvent(note);

  // Generate a data URI
  var write = new MidiWriter.Writer(track);

  const filename = makeFilename(noteName)
  console.log('"' + filename + '",')
  fs.writeFile("midi/" + filename + ".midi", write.buildFile(), function(err) {
     if(err) {
          return console.log(err);
      }
  })
})
