backupApp.directive('destinationFolderPicker', function() {
  return {
    restrict: 'E',
    require: ['ngModel'],
    scope: {
        ngModel: '=',
        ngShowHidden: '=',
        ngHideUserNode: '='
    },
    templateUrl: 'templates/targetfolderpicker.html',

    controller: function($scope, $timeout, SystemInfo, AppService, AppUtils) {

        var scope = $scope;
        scope.systeminfo = SystemInfo.watch($scope);

        $scope.treedata = {};


        function compareablePath(path) {
            var dirsep = scope.systeminfo.DirectorySeparator || '/';

            if (path.substr(0, 1) == '%' && path.substr(path.length - 1, 1) == '%')
                path += dirsep;

            return scope.systeminfo.CaseSensitiveFilesystem ? path : path.toLowerCase();
        };

        function setIconCls(n) {
            var cp = compareablePath(n.id);

            if (cp == compareablePath('%MY_DOCUMENTS%'))
                n.iconCls = 'x-tree-icon-mydocuments';
            else if (cp == compareablePath('%MY_MUSIC%'))
                n.iconCls = 'x-tree-icon-mymusic';
            else if (cp == compareablePath('%MY_PICTURES%'))
                n.iconCls = 'x-tree-icon-mypictures';
            else if (cp == compareablePath('%DESKTOP%'))
                n.iconCls = 'x-tree-icon-desktop';
            else if (cp == compareablePath('%HOME%'))
                n.iconCls = 'x-tree-icon-home';
            else if (defunctmap[cp])
                n.iconCls = 'x-tree-icon-broken';
            else if (cp.substr(cp.length - 1, 1) != dirsep)
                n.iconCls = 'x-tree-icon-leaf';
        }

        $scope.toggleExpanded = function(node) {
            if (node.root && $scope.ngHideUserNode)
                return;

            node.expanded = !node.expanded;

            if (node.root || node.iconCls == 'x-tree-icon-leaf' || node.iconCls == 'x-tree-icon-locked')
                return;

            if (!node.children && !node.loading) {
                node.loading = true;

                AppService.post('/filesystem?onlyfolders=true&showhidden=true', {path: node.id}).then(function(data) {
                    node.children = data.data;
                    node.loading = false;
                    
                }, function() {
                    node.loading = false;
                    node.expanded = false;
                    AppUtils.connectionError.apply(AppUtils, arguments);
                });
            }
        };

        $scope.toggleSelected = function(node) {
            if (scope.selectednode != null)
                scope.selectednode.selected = false;

            scope.selectednode = node;
            scope.selectednode.selected = true;
            scope.ngModel = node.id;
        };

        function updateHideUserNode() {
            if ($scope.treedata.children == null)
                return;

            if ($scope.ngHideUserNode) {
                scope.treedata.children[0].invisible = true;
                scope.treedata.children[1].expanded = true;
            } else {
                scope.treedata.children[0].invisible = false;
            }
        }

        $scope.$watch('ngHideUserNode', updateHideUserNode);
        
        AppService.post('/filesystem?onlyfolders=true&showhidden=true', {path: '/'}).then(function(data) {

            var usernode = {
                text: 'User data',
                root: true,
                iconCls: 'x-tree-icon-userdata',
                expanded: true,
                children: []
            };
            var systemnode = {
                text: 'Computer',
                root: true,
                iconCls: 'x-tree-icon-computer',
                children: []
            };

            scope.treedata.children = [
                usernode, 
                systemnode
            ];

            for(var i = 0; i < data.data.length; i++) {
                if (data.data[i].id.indexOf('%') == 0) {
                    setIconCls(data.data[i]);
                    usernode.children.push(data.data[i]);
                }
                else
                    systemnode.children.push(data.data[i]);
            }

            updateHideUserNode();

        }, AppUtils.connectionError);
    }
  }
});