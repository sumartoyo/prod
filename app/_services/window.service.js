var windowService = new (function() {

	var self = this;

	self.gui = require('nw.gui');
	self.window = self.gui.Window.get();

    window.addEventListener('keydown', function(event) {
        if (event.keyIdentifier === 'F12') {
            self.window.showDevTools();
        }
        else if (event.keyIdentifier === 'F11') {
			self.window.reload();
        }
    });

    (function menuInit() {

        var menuFile = new self.gui.Menu();
        menuFile.append(new self.gui.MenuItem({ label: 'Open', click: fileService.open, key: 'o', modifiers: 'ctrl' }));
        menuFile.append(new self.gui.MenuItem({ label: 'Save', click: fileService.save, key: 's', modifiers: 'ctrl' }));

        var menuOperat = new self.gui.Menu();
        menuOperat.append(new self.gui.MenuItem({ label: 'Run', click: runService.exec, key: 'r', modifiers: 'ctrl' }));

        var menuRoot = new self.gui.Menu({ 'type': 'menubar' });
        menuRoot.append(new self.gui.MenuItem({ label: 'File', submenu: menuFile }));
        menuRoot.append(new self.gui.MenuItem({ label: 'Operation', submenu: menuOperat }));

        self.window.menu = menuRoot;
    })();
})();
