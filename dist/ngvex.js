/**
 * Some patches to Vex so it fits our needs.
 *
 */


_.each( _.keys(MIDI.Soundfont), function(instrument) {
  MIDI.loadPlugin({ instrument: instrument });
  Vex.Flow.Player.INSTRUMENTS_LOADED[instrument] = true;
});

function L() { console.log("NGVex: ", arguments); }

function NGTabDiv(sel, options) {
  if (arguments.length > 0) this.init(sel, options);
}
NGTabDiv.prototype = Object.create(Vex.Flow.TabDiv.prototype);

NGTabDiv.prototype.init = function(sel, options) {
  this.sel = sel;

  // Grab code and clear tabdiv
  this.code = $(sel).text();
  $(sel).empty();
  if ($(sel).css("position") == "static") {
    $(sel).css("position", "relative");
  }

  // Get tabdiv properties
  this.width = options.width || 400;
  this.height = options.height || 200;
  this.scale = options.scale || 1.0;

  // resort to HTML5 Canvas.
  this.canvas = $('<canvas></canvas>').addClass("vex-canvas");
  $(sel).append(this.canvas);
  this.renderer = new Vex.Flow.Renderer(this.canvas[0],
      Vex.Flow.Renderer.Backends.CANVAS);

  this.ctx_sel = $(sel).find(".vex-canvas");
  this.renderer.resize(this.width, this.height);
  this.ctx = this.renderer.getContext();
  this.ctx.setBackgroundFillStyle(this.ctx_sel.css("background-color"));
  this.ctx.scale(this.scale, this.scale);

  // Initialize parser.
  this.artist = new NGArtist(10, 0, this.width, {scale: this.scale});
  this.parser = new VexTab(this.artist);

  if (Vex.Flow.Player) {
    opts = {
      show_controls: false,
    };
    if (options) opts.soundfont_url = options.soundfont_url;
    this.player = new NGPlayer(this.artist, opts);
  }

  this.redraw();
}


function NGPlayer(artist, options) {
  Vex.Flow.Player.apply(this, arguments);

  this.paused = false;
}
NGPlayer.prototype = Object.create(Vex.Flow.Player.prototype);

NGPlayer.prototype.INSTRUMENTS = {
  "acoustic_grand_piano": 0,
  "acoustic_guitar_nylon": 24,
  "acoustic_guitar_steel": 25,
  "electric_guitar_jazz": 26,
  "distortion_guitar": 30,
  "electric_bass_finger": 33,
  "electric_bass_pick": 34,
  "trumpet": 56,
  "brass_section": 61,
  "soprano_sax": 64,
  "alto_sax": 65,
  "tenor_sax": 66,
  "baritone_sax": 67,
  "flute": 73,
  "synth_drum": 118
};

NGPlayer.prototype.start = function() {
  var _this = this;
  if (this.play_button != null) {
    this.play_button.fillColor = '#a36';
  }
  MIDI.programChange(0, this.INSTRUMENTS[this.options.instrument]);

  if (!this.paused) {
    this.stop();
    this.render();
  }

  this.paused = false;

  return this.interval_id = window.setInterval((function() {
    return _this.refresh();
  }), this.refresh_rate);
};

NGPlayer.prototype.stop = function() {
  Vex.Flow.Player.prototype.stop.call(this);
  this.paused = false;
}

NGPlayer.prototype.pause = function() {
  if (this.interval_id != null) {
    window.clearInterval(this.interval_id);
  }
  if (this.play_button != null) {
    this.play_button.fillColor = '#396';
  }
  if (this.paper != null) {
    this.paper.view.draw();
  }
  this.interval_id = null;
  return this.paused = true;
}

NGPlayer.prototype.setTempo = function(tempo) {
  this.options.tempo = tempo;
  this.tpm = this.options.tempo * (Vex.Flow.RESOLUTION / 4);
  this.ticks_per_refresh = this.tpm / (60 * (1000 / this.refresh_rate));
};

NGPlayer.prototype.playNote = function(notes) {
  var self = this;

  var duration, key, keys, tab_spec, midi_note, note, note_value, octave, x, y, _i, _len, _results;
  var noteValues = Vex.Flow.Music.noteValues;
  L("(" + this.current_ticks + ") playNote: ", notes);
  _results = [];
  for (_i = 0, _len = notes.length; _i < _len; _i++) {
    note = notes[_i];
    x = note.getAbsoluteX() + 4;
    y = note.getStave().getYForLine(2);
    if (this.paper != null) {
      this.updateMarker(x, y);
      this.onUpdateMarker(this.scale*x, this.scale*y, note);
    }
    if (note.isRest()) {
      continue;
    }
    keys = note.getPlayNote();

    duration = note.getTicks().value() / (this.tpm / 60);
    _results.push((function() {
      var _j, _len1, _ref, _results1;
      _results1 = [];

      self.onNoteOn(note);

      for (_j = 0, _len1 = keys.length; _j < _len1; _j++) {
        key = keys[_j];
        _ref = key.split("/"), note = _ref[0], octave = _ref[1];
        note = note.trim().toLowerCase();
        note_value = noteValues[note];
        if (note_value == null) {
          continue;
        }
        midi_note = (24 + (octave * 12)) + noteValues[note].int_val;
        MIDI.noteOn(0, midi_note, 127, 0);
        _results1.push(MIDI.noteOff(0, midi_note, duration));
      }
      return _results1;
    })());
  }
  return _results;
};

NGPlayer.prototype.onNoteOn = function (notes) {
  // stub.
}

NGPlayer.prototype.onUpdateMarker = function (x,y,note) {
  // stub.
}

function NGArtist(artist, options) {
  Artist.NOLOGO = true;
  Artist.apply(this, arguments);
}
NGArtist.prototype = Object.create(Artist.prototype);

NGArtist.prototype.addStaveNote = function(note_params) {
  var acc, index, new_accidental, params, parts, stave_note, stave_notes, _i, _len, _ref;
  params = {
    is_rest: false,
    play_note: null,
    tab_spec: []
  };
  _.extend(params, note_params);
  stave_notes = _.last(this.staves).note_notes;
  stave_note = new Vex.Flow.StaveNote({
    keys: params.spec,
    duration: this.current_duration + (params.is_rest ? "r" : ""),
    clef: params.is_rest ? "treble" : this.current_clef,
    auto_stem: params.is_rest ? false : true
  });
  stave_note.tab_spec = params.tab_spec;
  _ref = params.accidentals;
  for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
    acc = _ref[index];
    if (acc != null) {
      parts = acc.split("_");
      new_accidental = new Vex.Flow.Accidental(parts[0]);
      if (parts.length > 1 && parts[1] === "c") {
        new_accidental.setAsCautionary();
      }
      stave_note.addAccidental(index, new_accidental);
    }
  }
  if (this.current_duration[this.current_duration.length - 1] === "d") {
    stave_note.addDotToAll();
  }
  if (params.play_note != null) {
    stave_note.setPlayNote(params.play_note);
  }
  return stave_notes.push(stave_note);
};

NGArtist.prototype.addChord = function(chord, chord_articulation, chord_decorator) {
  var acc, accidental, accidentals, art, articulations, current_duration, current_position, current_string, decorators, durations, i, new_note, new_octave, note, num, num_notes, octave, play_note, play_notes, play_octave, saved_duration, spec, specs, stave, tab_specs, _i, _j, _k, _len, _len1, _ref, _ref1, _ref2;
  if (_.isEmpty(chord)) {
    return;
  }
  L("addChord: ", chord);
  stave = _.last(this.staves);
  specs = [];
  play_notes = [];
  accidentals = [];
  articulations = [];
  decorators = [];
  tab_specs = [];
  durations = [];
  num_notes = 0;
  current_string = _.first(chord).string;
  current_position = 0;
  for (_i = 0, _len = chord.length; _i < _len; _i++) {
    note = chord[_i];
    num_notes++;
    if ((note.abc != null) || note.string !== current_string) {
      current_position = 0;
      current_string = note.string;
    }
    if (specs[current_position] == null) {
      specs[current_position] = [];
      play_notes[current_position] = [];
      accidentals[current_position] = [];
      tab_specs[current_position] = [];
      articulations[current_position] = [];
      decorators[current_position] = [];
    }
    _ref = [null, null, null], new_note = _ref[0], new_octave = _ref[1], accidental = _ref[2];
    play_note = null;
    if (note.abc != null) {
      octave = note.octave != null ? note.octave : note.string;
      _ref1 = this.getNoteForABC(note.abc, octave), new_note = _ref1[0], new_octave = _ref1[1], accidental = _ref1[2];
      if (accidental != null) {
        acc = accidental.split("_")[0];
      } else {
        acc = "";
      }
      play_note = "" + new_note + acc;
      if (note.fret == null) {
        note.fret = 'X';
      }
    } else if (note.fret != null) {
      _ref2 = this.getNoteForFret(note.fret, note.string), new_note = _ref2[0], new_octave = _ref2[1], accidental = _ref2[2];
      play_note = this.tuning.getNoteForFret(note.fret, note.string).split("/")[0];
    } else {
      throw new Vex.RERR("ArtistError", "No note specified");
    }
    play_octave = parseInt(new_octave, 10) + this.current_octave_shift;
    current_duration = note.time != null ? {
      time: note.time,
      dot: note.dot
    } : null;
    specs[current_position].push("" + new_note + "/" + new_octave);
    play_notes[current_position].push("" + play_note + "/" + play_octave);
    accidentals[current_position].push(accidental);
    tab_specs[current_position].push({
      fret: note.fret,
      str: note.string
    });
    if (note.articulation != null) {
      articulations[current_position].push(note.articulation);
    }
    durations[current_position] = current_duration;
    if (note.decorator != null) {
      decorators[current_position] = note.decorator;
    }
    current_position++;
  }
  for (i = _j = 0, _len1 = specs.length; _j < _len1; i = ++_j) {
    spec = specs[i];
    saved_duration = this.current_duration;
    if (durations[i] != null) {
      this.setDuration(durations[i].time, durations[i].dot);
    }
    this.addTabNote(tab_specs[i], play_notes[i]);
    if (stave.note != null) {
      this.addStaveNote({
        spec: spec,
        accidentals: accidentals[i],
        play_note: play_notes[i],
        tab_spec: tab_specs[i]
      });
    }
    this.addArticulations(articulations[i]);
    if (decorators[i] != null) {
      this.addDecorator(decorators[i]);
    }
  }
  if (chord_articulation != null) {
    art = [];
    for (num = _k = 1; 1 <= num_notes ? _k <= num_notes : _k >= num_notes; num = 1 <= num_notes ? ++_k : --_k) {
      art.push(chord_articulation);
    }
    this.addArticulations(art);
  }
  if (chord_decorator != null) {
    return this.addDecorator(chord_decorator);
  }
};


