# NGVexPlayer

Angular directives around VexTabDiv and Player.

This is developed for [GuitarraLedMobile](https://github.com/CrearAyT/GuitarraLedMobile) and will replace our current
[HTML5-Guitar-Tab-Player](https://github.com/CrearAyT/HTML5-Guitar-Tab-Player) (also based on Vex)


** This is a first public release that just barely fits our purposes.
It is not (already) packaged, clean nor modularized like it should.
The current naming is not final.
In case of doubt read the source.**


What works so far:

  * Play, pause and stop.
  * Change of tempo without stopping.

What doesn't:

  * Live resizing or scaling
  * Automatic scrolling.

### Requisites:
(All these are already included with the demo app)

  * VexTabDiv
  * a compiled version of player.coffee
  * MIDI.js
  * some soundfonts

The soundfonts path is hardcoded to */soundfonts/* (and /*/android_asset/www/soundfont/* on Android)

The trailing slash is important.

### Usage:

Import the scripts and directive.

On your controller add something like:


```javascript
$scope.player = {
};

$scope.onNoteOn = function(notes) {
  // notes is an array of { str , fret }
}

$scope.song = "vextab song";
```

and on your template:

```html
<div vexplayer
  song="song"
  preload_soundfonts="true"
  player="player"
  on_note_on="onNoteOnCB"
  tempo="120"
  >
</div>
```

** $scope.player ** will be populated with:

  * player: the proper Player object. Has play(), pause() and stop() methods.
  * tabdiv: the TabDiv that does most of the hard work.

The directive also accepts the following parameters:

  * song: must be a valid vextab.
  * width, height, scale: they only work when building the tabdiv (for now).
  * tempo: can be changed while playing
  * preload_soundfonts: if true we try to load the soundfonts as soon as a directive is used so the first playback is faster.
  * on_note_on: function to be called when a note (or series of notes) is played. We use this to modify the led fretboard on the guitar.
