var ui = null;

(function() {

    angular.module('app').controller('UiController', UiController);

	UiController.$inject = ['$scope', '$uibModal'];

    function UiController($scope, $uibModal) {

        ui = $scope;

        $scope.ifacts = '';
        $scope.irules = '';
        $scope.wmes = [];
        $scope.rules = [];
        $scope.logs = [];

        $scope.alert = function(params) {
            var p = params;
            p.label = {yes:false, no:false, cancel:'Close'};
            p.class = {};
            $scope.confirm(p);
        };

        $scope.confirm = function(params) {
            $uibModal.open({
                templateUrl: 'app/ui/confirm.html',
                controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
                    var p = params || {};
                    // defaults
                    $scope.body = 'Are you sure?';
                    $scope.label = {
                        yes: 'Yes',
                        no: 'No',
                        cancel: 'Cancel',
                    };
                    $scope.class = {
                        yes: 'btn-default',
                        no: 'btn-default',
                        cancel: 'btn-default',
                    };
                    // merge
                    $scope.title = p.title;
                    $scope.body = p.body;
                    angular.extend($scope.label, p.label);
                    angular.extend($scope.class, p.class);
                    $scope.yes = p.yes || function() {
                        $uibModalInstance.dismiss('cancel');
                    };
                    $scope.no = p.no || function() {
                        $uibModalInstance.dismiss('cancel');
                    };
                    $scope.cancel = function() {
                        $uibModalInstance.dismiss('cancel');
                    };
                }],
            });
        };

        (function initTextarea() {

            $('textarea').keydown(function(e) {

                if(e.keyCode === 9) { // tab was pressed

                    // get caret position/selection
                    var start = this.selectionStart;
                    var end = this.selectionEnd;

                    var $this = $(this);
                    var value = $this.val();

                    // set textarea value to: text before caret + tab + text after caret
                    $this.val(value.substring(0, start)
                    + '\t'
                    + value.substring(end));

                    // put caret at right position again (add one for the tab)
                    this.selectionStart = this.selectionEnd = start + 1;

                    // prevent the focus lose
                    e.preventDefault();
                }
            });
        })();
    }
})();
