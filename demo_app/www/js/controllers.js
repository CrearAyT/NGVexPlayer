angular.module('starter.controllers', ['ui.bootstrap'])

.controller('DashCtrl', function($scope, $interpolate, $modal) {
    window._scope = $scope;

    $scope.player = {
        width: 400,
        height: 200,
        scale: 1.0,
        tempo: 120,
    };
    $scope.doPlay = function() {
        $scope.player.player.play();
    }

    $scope.onNoteOnCB = function(note) {
        console.log('onNoteOnCB: ', note.tab_spec);
    }

    $scope.song = "options beam-rests=false tab-stems=true tab-stem-direction=down player=true\
\ntabstave notation=true key=Bb\
\n\
\nnotes :8 ## 6/2 6/1 s11/2 | :q T 11/2 D@6_9/1 :h ##  |\
\nnotes :8 ## 6/2 6/1 A@5_9p6/2 ^3^ :16 F@5_9p8pD@5_6/3 ^3^ :8 8/4 8/3 8/4 D@5_6/3 ^3^\
\n\
\ntext .font=Arial-16-\
\ntext  :h, F7, |, :w, Bb7, |, Eb7\
\noptions space=80\
\n\
\ntabstave notation=true key=Bb \
\n\
\nnotes :8 T D@5_6/3 :8 ## :q ## ## :8 (D@5_6/3.7/4.6/5) (5/3.A@4_6/4.5/5)\
\n\
\ntext .font=Arial-16-\
\ntext  :w, Bb7\
\n";


})



;
