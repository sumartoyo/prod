var fileService = new (function() {

    var self = this;
    var io = require('./app/_modules/io');
    var chooser = {open: null, save: null};
    var current = null;

    self.open = function() {
        chooser.open.dialog(function(path, text) {
            runService.load(path, text);
        });
    };

    self.save = function() {
        chooser.save.dialog();
    };

    (function initOpen() {
		chooser.open = $('#fileOpen');
		chooser.open.unbind('change');
        chooser.open.change(function(evt) {
            var path = $(this).val();
            if (path != '') {
                $.get(path)
                    .done(function(data) {
                        if (chooser.open.done) {
                            chooser.open.done(path, data);
                        }
                        current = path;
                    })
                    .fail(function(err) {
                        ui.alert({body: "Can't read file"});
                        console.log(err);
                    })
                    .always(function() {
                        chooser.open.val('');
                    });
            }
        });
        chooser.open.dialog = function(done) {
            chooser.open.done = done;
            chooser.open.trigger('click');
        };
    })();

    (function() {
		chooser.save = $('#fileSave');
		chooser.save.unbind('change');
		chooser.save.change(function(evt) {
            current = $(this).val();
            io.save(current, ui.facts+'\n\n'+ui.rules+'\n')
                .then(function() {
                    if (chooser.save.done) {
                        chooser.save.done(current);
                    }
                })
                .catch(function(err) {
                    ui.alert("Can't save file");
                    console.log(err);
                });
		});
        chooser.save.dialog = function(done) {
            chooser.save.done = done;
            if (current) {
                chooser.save.attr('nwsaveas', current);
            }
            chooser.save.trigger('click');
        };
	})();
})();
