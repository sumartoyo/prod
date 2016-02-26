var Parser = function(text) {

    var self = this;

    self.file = function(text) {
        var blocks = text.replace('\r', '').split('\n\n');
        var facts = [];
        var rules = [];
        blocks.forEach(function(block) {
            block = block.trim();
            if (/^\(/gi.test(block)) {
                facts.push(block);
            } else if (/^if\s+/gi.test(block)) {
                rules.push(block);
            }
        });
        return {facts:facts, rules:rules};
    };

    var wmes = function(text, isFact) {
        // remove unneeded space
        text = text.replace(/\s+/g, ' ');
        text = text.replace(/\s*(\(|\))\s*/g, '$1');
        text = text.replace(/\s*(\[|\{|\<)\s*/g, '$1');
        text = text.replace(/\s*:\s*/g, ':');
        // make atrribute-value json
        text = text.replace(/(\[|\{|\<)/g, '"$1');
        text = text.replace(/(\]|\}|\>)/g, '$1"');
        text = text.replace(/\(/g, '(_type:');
        text = text.replace(/:([A-Za-z0-9_]+)/g, ':"$1"');
        text = text.replace(/([A-Za-z0-9_]+):/g, '"$1":');
        // property delimiter
        text = text.replace(/\" /g, '",');
        text = text.replace(/\" /g, '",');
        // handle negation
        text = text.replace(/(\-|−)\(/g, '("_neg":true,');
        // format json object delimiter
        text = text.replace(/\)\(/g, '},{');
        text = text.replace(/\)/g, '}');
        text = text.replace(/\(/g, '{');
        // parse
        text = '['+text+']';
        var objs = false;
        try {
            objs = JSON.parse(text);
        } catch(e) {
            console.log(text);
            throw 'Syntax error in `Facts`';
        }
        // now let's read prop values
        objs.forEach(function(obj) {
            var wme = (obj._neg ? '-' : '') + '(';
            wme += obj._type;
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop) && prop[0] != '_') {
                    var val = obj[prop];
                    wme += ' '+prop+':'+val;
                    // convert to number
                    if (isFact) {
                        // facts are not negations
                        if (obj._neg) {
                            throw 'Negations are not allowed in `Facts`';
                        }
                        // facts supposed to not have variables
                        if (/^[a-z]{1}$/g.test(val)) {
                            throw 'Variables are not allowed in `Facts`';
                        }
                        // facts supposed to not have expressions
                        if (/^\{/g.test(val)) {
                            throw 'Evaluable expressions are not allowed in `Facts`';
                        }
                        // facts supposed to not have tests
                        if (/^\[/g.test(val)) {
                            throw 'Tests are not allowed in `Facts`';
                        }
                        // facts supposed to not have specials
                        if (/^\</g.test(val)) {
                            throw 'Specials are not allowed in `Facts`';
                        }
                    }
                    // let's read em
                    if (!isNaN(val)) {
                        obj[prop] = {_type:'number', _val:parseFloat(val)};
                    }
                    else if (/^[a-z]{1}$/g.test(val)) {
                        obj[prop] = {_type:'variable', _val:val};
                    }
                    else if (val[0] == '[') {
                        obj[prop] = {_type:'expression', _val:val.substr(1,val.length-2)};
                    }
                    else if (val[0] == '{') {
                        obj[prop] = {_type:'test', _val:val.substr(1,val.length-2)};
                    }
                    else if (val[0] == '<') {
                        obj[prop] = {_type:'special', _val:val.substr(1,val.length-2)};
                    }
                    else {
                        obj[prop] = {_type:'string', _val:val};
                    }
                }
            }
            wme += ')';
            obj._wme = wme;
        });
        // return
        return objs;
    };

    self.facts = function(text) {
        return wmes(text, true);
    };

    self.rules = function(text) {
        var rules = [];
        text = text.trim();
        text = text.replace(/\r/gi, '');
        blocks = text.split('\n\n');
        // parse rules
        blocks.forEach(function(block) {
            block = block.trim();
            if (block) {
                if (!(/^if\s+/gi.test(block))) {
                    throw 'Non rule detected in `Rules`';
                }
                var rule = block.split(/\s+then\s+/gi);
                if (rule.length < 2) {
                    throw 'A rule doesn\'t have `THEN`';
                }
                if (rule.length > 2) {
                    throw 'A rule has more than one `THEN`';
                }
                rules.push({conds:rule[0].substr(2).trim(), acts:rule[1].trim(), raw:block});
            }
        });
        // now let's parse conditions into WME-ish
        rules.forEach(function(rule) {
            var conds = false;
            try {
                conds = wmes(rule.conds, false);
            } catch(e) {
                throw 'A rule has invalid condition';
            }
            rule.conds = conds;
        });
        // success
        return rules;
    };
};
