// GurrenLock preview — uses the installed mod's exact playback script.
(function () {
    var hud = $.GetContextPanel();
    var heroes = [{"hero": "hero_atlas", "name": "Abrams"}, {"hero": "hero_fencer", "name": "Apollo"}, {"hero": "hero_baba", "name": "Baba"}, {"hero": "hero_bebop", "name": "Bebop"}, {"hero": "hero_punkgoat", "name": "Billy"}, {"hero": "hero_nano", "name": "Calico"}, {"hero": "hero_unicorn", "name": "Celeste"}, {"hero": "hero_deadpack", "name": "DeadmanDanny"}, {"hero": "hero_drifter", "name": "Drifter"}, {"hero": "hero_doorman", "name": "Doorman"}, {"hero": "hero_dynamo", "name": "Dynamo"}, {"hero": "hero_ghost", "name": "LadyGeist"}, {"hero": "hero_necro", "name": "Graves"}, {"hero": "hero_orion", "name": "GreyTalon"}, {"hero": "hero_haze", "name": "Haze"}, {"hero": "hero_astro", "name": "Holliday"}, {"hero": "hero_inferno", "name": "Infernus"}, {"hero": "hero_tengu", "name": "Ivy"}, {"hero": "hero_kelvin", "name": "Kelvin"}, {"hero": "hero_lash", "name": "Lash"}, {"hero": "hero_krill", "name": "MoAndKrill"}, {"hero": "hero_werewolf", "name": "Silver"}];
    var index = 0, revision = 0;
    function find(id) { return hud.FindChildTraverse(id); }
    function registered(panel, depth) {
        if (!panel || !panel.IsValid()) return null;
        if (panel.GetAttributeString("gurrenlock_preview_player", "") === "ready") return panel;
        if (depth <= 0) return null;
        for (var i = 0; i < panel.GetChildCount(); i++) {
            var found = registered(panel.GetChild(i), depth - 1);
            if (found) return found;
        }
        return null;
    }
    function player() {
        // CustomLayoutPanel preserves its container ID when mounting a layout.
        // The context registration identifies the same panel captured by the
        // production player; do not assume the source XML's root ID survives.
        return registered(find("GurrenLockPreviewStage"), 4);
    }
    function restart() {
        var token = ++revision;
        var window = find("GurrenLockPreviewWindow");
        function startWhenReady(attempt) {
            if (token !== revision || !hud.IsValid()) return;
            var r = player();
            if (!r) {
                if (attempt < 30) { $.Schedule(0.1, function () { startWhenReady(attempt + 1); }); }
                else $.Msg("[GurrenLock Preview v2] Player context not registered; overlay remains closed");
                return;
            }
            r.RemoveClass("ShowPregame");
            for (var i = 0; i < heroes.length; i++) r.RemoveClass(heroes[i].hero);
            r.AddClass(heroes[index].hero);
            // Set these on the registered script context, not a layout child.
            r.AddClass("State_HeroReveal");
            r.AddClass("HeroLoaded");
            find("GurrenLockPreviewHero").text = heroes[index].name;
            window.visible = true;
            window.AddClass("GurrenLockPreviewExpanded");
            $.Schedule(0.3, function () {
                if (token !== revision || !hud.IsValid() || !r.IsValid() || !window.visible) return;
                r.AddClass("ShowPregame");
                $.Msg("[GurrenLock Preview v2] Playing " + heroes[index].name + " on " + r.id);
            });
        }
        startWhenReady(0);
    }
    function close() {
        revision++;
        var r = player();
        if (r && r.IsValid()) r.RemoveClass("ShowPregame");
        var window = find("GurrenLockPreviewWindow");
        if (window && window.IsValid()) {
            window.RemoveClass("GurrenLockPreviewExpanded");
            window.visible = false;
        }
    }
    function init() {
        if (!hud || !hud.IsValid()) return;
        close(); // Explicit startup state; never rely on the XML visible attribute.
        find("GurrenLockPreviewOpen").SetPanelEvent("onactivate", restart);
        find("GurrenLockPreviewRestart").SetPanelEvent("onactivate", restart);
        find("GurrenLockPreviewClose").SetPanelEvent("onactivate", close);
        find("GurrenLockPreviewPrevious").SetPanelEvent("onactivate", function () {
            index = (index + heroes.length - 1) % heroes.length;
            restart();
        });
        find("GurrenLockPreviewNext").SetPanelEvent("onactivate", function () {
            index = (index + 1) % heroes.length;
            restart();
        });
        $.Msg("[GurrenLock Preview v2] Ready — press Esc, then GurrenLock · Проверка");
    }
    $.Schedule(0.0, init);
})();
