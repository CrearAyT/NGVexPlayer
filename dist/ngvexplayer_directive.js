angular.module('VexAngular', [])
.directive('vexplayer',
  function ($log) {
    var soundfont_url = "/soundfont/";

    if (ionic.Platform.isAndroid()) {
      soundfont_url = "/android_asset/www/soundfont/";
    }

    function __preload() {
        //var instruments = _.keys(NGPlayer.prototype.INSTRUMENTS);
        var instruments = [ "acoustic_grand_piano" ];

        for (var idx in instruments) {
            var inst = instruments[idx];

            if (_.has(MIDI.Soundfont, inst)) {
              continue;
            }

            function __make_cb() {
                var __inst = inst;
                function __cb() {
                  Vex.Flow.Player.INSTRUMENTS_LOADED[__inst] = true;
                }
                return __cb;
            }

            MIDI.loadPlugin({
              soundfontUrl: soundfont_url,
              instrument: inst,
              callback: __make_cb(),
            });
        }
    }

    return {
      restrict: 'EA',
      scope: {
        model: '=song',
        player: '=',
        tempo: '=',
        scale: '=',
        width: '=',
        height: '=',
        preload: '=preloadSoundfonts',
        onNoteOn: '&?',
        onUpdateMarker: '&?',
      },
      link: function (scope, element, attrs, controller) {

        var td = new NGTabDiv(element, scope);
        var markerCb = undefined;

        td.setCode(scope.model);

        if (scope.player != undefined) {
            scope.player.tabdiv = td;
            scope.player.player = td.player;
            scope.player.marker = {x:0, y:0};
        }

        if (scope.preload) {
            __preload();
        }

        scope.$watch('model', function(newValue, oldValue) {
          if (typeof newValue !== 'undefined') {
            td.setCode(newValue);
          }
        });

        scope.$watch('onNoteOn', function(newValue, oldValue) {
          if (_.isFunction(newValue)) {
            td.player.onNoteOn = newValue();
          } else {
            td.player.onNoteOn = function(){};
          }
        });

        td.player.onUpdateMarker = function(x,y,note) {
          if (markerCb) {
            markerCb(x,y,note);
          }
          if (scope.player) {
            scope.player.marker = {x:x, y:y};
            scope.$apply();
          }
        };
        scope.$watch('onUpdateMarker', function(newValue, oldValue) {
          if (_.isFunction(newValue)) {
            markerCb = newValue();
          } else {
            markerCb = undefined;
          }
        });

        scope.$watch('tempo', function(newValue, oldValue) {
          if (typeof newValue !== 'undefined') {
            td.player.setTempo(newValue);
          }
        });

        //XXX FIXME: does not work yet.
        scope.$watch(function(scope) {
            var ret = [scope.width, scope.height, scope.scale].join(':');
            return ret;
        }, function(newValue, oldValue, scope) {
            var width = angular.isDefined(scope.width) ? parseInt(scope.width) : 400;
            var height = angular.isDefined(scope.height) ? parseInt(scope.height) : 200;
            var scale = angular.isDefined(scope.scale) ? parseFloat(scope.scale) : 1.0;

            td.width = width;
            td.height = height;
            td.scale = scale;

            element.attr('width', width);
            element.attr('height', height);

            td.renderer.resize(width, height);
            td.ctx.scale(scale, scale);
            td.redraw();
        });
      }
    };
  }
);
