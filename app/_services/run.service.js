var runService = new (function() {

    var self = this;
    var parser = new Parser();

    self.load = function(path, text) {
        var file = parser.file(text);
        ui.$apply(function() {
            ui.ifacts = file.facts.join('\n\n');
            ui.irules = file.rules.join('\n\n');
            ui.wmes = [];
            ui.rules = [];
            ui.logs = [];
        });
    };

    var typeNonAtomic = ['expression', 'test', 'variable', 'special'];
    var junctions = ['&&', '||', 'and', 'or'];
    var comparer = ['==', '=', '!=', '<>', '<', '>', '<=', '>='];
    var wmes = null;
    var rules = null;

    var transformToken = function(token) {
        var transformed = token;
        switch (token) {
            case 'and':
                transformed = ' && ';
                break;
            case 'or':
                transformed = ' || ';
                break;
            case '=':
                transformed = ' == ';
                break;
            case '<>':
                transformed = ' != ';
                break;
        }
        return transformed;
    }

    var evalTest = function(prop, wme, cond) {
        // formatting script
        var vars = [];
        var script = '';
        var tokens = cond[prop]._val.split(' ');
        tokens.forEach(function(token) {
            if (token.length > 0) {
                if (comparer.indexOf(token) > -1) {
                    if (vars.indexOf(prop) == -1) {
                        vars.push(prop);
                    }
                    script += ' '+prop+' '+transformToken(token);
                } else if (junctions.indexOf(token) > -1) {
                    script += transformToken(token);
                } else if (!isNaN(token)) {
                    script += token;
                } else if (token.length == 1) {
                    var param = wme[wme._thisRule.var[token]];
                    var val = param._val;
                    if (param._type == 'string') {
                        val = '"'+val+'"';
                    }
                    script += val;
                } else {
                    script += '"'+token+'"';
                }
            }
        });
        // testing
        var thereExists = false;
        if (vars.length == 0) {
            try {
                thereExists = eval(script);
            } catch(e) {}
        } else {
            vars.forEach(function(name) {
                wmes.forEach(function(_wme) {
                    if (!thereExists && _wme[name] && _wme._withRules[wme._thisRule.idxRule].isMatch !== false) {
                        var param = _wme[name];
                        var val = param._val;
                        if (param._type == 'string') {
                            val = '"'+val+'"';
                        }
                        var _script = script.replace(' '+name+' ', val);
                        try {
                            thereExists = eval(_script);
                        } catch(e) {}
                    }
                });
            });
        }
        // return
        return thereExists;
    }

    var getIsPropMatch = function(wme, cond) {
        if (wme._type == cond._type) {
            var isPropMatch = true;
            for (var prop in cond) {
                if (cond.hasOwnProperty(prop) && prop[0] != '_') {
                    if (!(prop in wme)) {
                        isPropMatch = false;
                        break;
                    }
                    var specCond = cond[prop];
                    var specWme = wme[prop];
                    if (!(typeNonAtomic.indexOf(specCond._type) > -1 || specCond._type == specWme._type)) {
                        isPropMatch = false;
                        break;
                    }
                    if (specCond._type == specWme._type && specCond._val != specWme._val) {
                        isPropMatch = false;
                        break;
                    }
                    if (specCond._type == 'test') {
                        var thereExists = evalTest(prop, wme, cond);
                        if (!thereExists) {
                            isPropMatch = false;
                        }
                        break;
                    }
                    if (specCond._type == 'special') {
                        if (specCond._val != 'greatest') {
                            var isGreatest = true;
                            wmes.forEach(function(_wme) {
                                if (isGreatest) {
                                    if (_wme._withRules[wme._thisRule.idxRule].isMatch !== false) {
                                        if (_wme._type == wme._type) {
                                            if (_wme[prop]._type == wme[prop]._type) {
                                                if (_wme[prop]._val > wme[prop]._val) {
                                                    isGreatest = false;
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                            if (!isGreatest) {
                                isPropMatch = false;
                            }
                        }
                        break;
                    }
                    if (specCond._type == 'variable') {
                        wme._thisRule.var[specCond._val] = prop;
                        continue;
                    }
                }
            }
            return isPropMatch;
        }
    }

    var getMatchesRules = function() {
        rules.forEach(function(rule, idxRule) {
            // initiate wme
            wmes.forEach(function(wme) {
                wme._withRules.push({
                    isMatch: undefined,
                    var: {},
                    matchConds: [],
                    idxRule: idxRule,
                });
            });
            // check each condition
            var isContinue = true;
            rule.conds.forEach(function(cond, idxCond) {
                if (isContinue) {
                    var thereExists = false;
                    // check each WME
                    wmes.forEach(function(wme) {
                        wme._thisRule = wme._withRules[idxRule];
                        var isMatch = getIsPropMatch(wme, cond);
                        // check existence
                        if (isMatch === true) {
                            thereExists = true;
                        }
                        // correcting isMatch
                        if (isMatch === true || isMatch === false) {
                            if (cond._neg) {
                                isMatch = !isMatch;
                            }
                        }
                        // flag rule
                        if (isMatch === true) {
                            if (wme._thisRule.isMatch !== false) {
                                wme._thisRule.isMatch = true;
                                wme._thisRule.matchConds.push(idxCond);
                            }
                        } else if (isMatch === false) {
                            wme._thisRule.isMatch = false;
                        }
                        delete wme._thisRule;
                    });
                    // isContinue or not to be
                    isContinue = cond._neg ? !thereExists : thereExists;
                    if (!isContinue) {
                        wmes.forEach(function(wme) {
                            wme._withRules[idxRule].isMatch = false;
                        });
                    }
                }
            });
        });
    }

    var printMatches = function() {
        var cs = ['Conflict Set'];
        wmes.forEach(function(wme, idxWme) {
            var w = 'W'+(idxWme+1)+'\t{';
            wme._withRules.forEach(function(thisRule, idxRule) {
                if (thisRule.isMatch === true) {
                    w += ' R'+(idxRule+1);
                }
            });
            w += ' }';
            cs.push(w);
        });
        ui.$apply(function() {
            ui.logs = ui.logs.concat(cs);
        });
    };

    var inference = function() {
        // var chosen = {wme:null, rule:null, conds:[]};
        // wmes.forEach(function(wme, idxWme) {
        //     wme._withRules.forEach(function(thisRule, idxRule) {
        //         if (thisRule.isMatch === true) {
        //             if (!(chosen.wme) && !(chosen.rule)) {
        //                 chosen.wme = idxWme;
        //                 chosen.rule = idxRule;
        //                 ui.$apply(function() {
        //                     ui.logs.push('', 'First in first out: W'+(idxWme+1)+' -> R'+(idxRule+1));
        //                 });
        //             }
        //         }
        //     });
        // });
    };

    var iterate = function() {
        setTimeout(function() {
            // prepare wmes
            wmes.forEach(function(wme) {
                wme._withRules = [];
            });
            // find matches
            getMatchesRules();
            // print matches
            printMatches();
            // inferencing
            inference();
            // update and cleanup
            wmes.forEach(function(wme) {
                delete wme._withRules;
                // TODO: update _wme
            });
        });
    };

    self.exec = function() {
        // try parse `Input Facts`
        wmes = false;
        try {
            wmes = parser.facts(ui.ifacts);
        } catch(e) {
            if (typeof e == 'object') {
                console.log(e);
                e = e.message;
            }
            ui.alert({title:'Syntax Error', body:e});
            return;
        }
        // try parse `Input Rules`
        rules = false;
        try {
            rules = parser.rules(ui.irules);
        } catch(e) {
            if (typeof e == 'object') {
                console.log(e);
                e = e.message;
            }
            ui.alert({title:'Syntax Error', body:e});
            return;
        }
        // reset UI
        ui.$apply(function() {
            ui.wmes = wmes;
            ui.rules = rules;
            ui.logs = [];
        });
        // do loop
        iterate();
    };
})();
