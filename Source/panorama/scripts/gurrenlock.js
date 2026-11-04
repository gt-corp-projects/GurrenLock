// GurrenLock / Irku_ — hero-specific loading screens, 1.1.
(function () {
    var root = $.GetContextPanel();
    var clips = {
    "hero_atlas": {
        "name": "Abrams",
        "duration": 8.266666666666667
    },
    "hero_fencer": {
        "name": "Apollo",
        "duration": 8.266666666666667
    },
    "hero_baba": {
        "name": "Baba",
        "duration": 8.266666666666667
    },
    "hero_bebop": {
        "name": "Bebop",
        "duration": 8.266666666666667
    },
    "hero_punkgoat": {
        "name": "Billy",
        "duration": 8.266666666666667
    },
    "hero_nano": {
        "name": "Calico",
        "duration": 8.266666666666667
    },
    "hero_unicorn": {
        "name": "Celeste",
        "duration": 8.266666666666667
    },
    "hero_deadpack": {
        "name": "DeadmanDanny",
        "duration": 8.266666666666667
    },
    "hero_drifter": {
        "name": "Drifter",
        "duration": 8.266666666666667
    },
    "hero_doorman": {
        "name": "Doorman",
        "duration": 8.266666666666667
    },
    "hero_dynamo": {
        "name": "Dynamo",
        "duration": 7.566666666666666
    },
    "hero_ghost": {
        "name": "LadyGeist",
        "duration": 8.266666666666667
    },
    "hero_necro": {
        "name": "Graves",
        "duration": 8.266666666666667
    },
    "hero_orion": {
        "name": "GreyTalon",
        "duration": 8.266666666666667
    },
    "hero_haze": {
        "name": "Haze",
        "duration": 8.266666666666667
    },
    "hero_astro": {
        "name": "Holliday",
        "duration": 8.266666666666667
    },
    "hero_inferno": {
        "name": "Infernus",
        "duration": 8.266666666666667
    },
    "hero_tengu": {
        "name": "Ivy",
        "duration": 8.266666666666667
    },
    "hero_kelvin": {
        "name": "Kelvin",
        "duration": 8.266666666666667
    },
    "hero_lash": {
        "name": "Lash",
        "duration": 8.266666666666667
    },
    "hero_krill": {
        "name": "MoAndKrill",
        "duration": 8.266666666666667
    },
    "hero_werewolf": {
        "name": "Silver",
        "duration": 8.266666666666667
    }
};
    var base = "file://{resources}/videos/GurrenLock/";
    var movie = null, still = null, activeHero = "", pendingHero = "", stableTicks = 0;
    var failedHero = "", session = 0, age = 0;

    function visible() {
        if (!root.BHasClass("ShowPregame") || !root.BHasClass("State_HeroReveal") ||
            !root.BHasClass("HeroLoaded")) return false;
        var p = root;
        while (p && p.IsValid()) {
            if (p.visible === false) return false;
            p = p.GetParent();
        }
        return root.actuallayoutwidth > 0 && root.actuallayoutheight > 0;
    }

    function selectedHero() {
        // Native per-hero classes are used by citadel_hero_logo.css and
        // citadel_hero_spotlight.css. Only inspect the current reveal widgets,
        // never the dashboard's roster or other players' hero panels.
        var panels = [root, root.FindChildTraverse("HeroLogo"),
                      root.FindChildTraverse("HeroSpotlight"), root.FindChildTraverse("HeroScenePanel")];
        var found = "";
        for (var i = 0; i < panels.length; i++) {
            var p = panels[i];
            if (!p || !p.IsValid()) continue;
            for (var hero in clips) {
                if (Object.prototype.hasOwnProperty.call(clips, hero) && p.BHasClass(hero)) {
                    if (found && found !== hero) return ""; // native widgets still updating
                    found = hero;
                }
            }
        }
        return found;
    }

    function removeMovie() {
        session++;
        if (movie && movie.IsValid()) movie.DeleteAsync(0);
        if (still && still.IsValid()) still.DeleteAsync(0);
        movie = null; still = null; activeHero = ""; age = 0;
        var host = root.FindChildTraverse("GurrenLockMovieHost");
        if (host && host.IsValid()) host.visible = false;
    }

    function begin(hero) {
        var host = root.FindChildTraverse("GurrenLockMovieHost");
        if (!host || !host.IsValid()) return;
        var stem = base + clips[hero].name;
        var token = session;
        // Native Movie can release its video texture at EOF. Keep a separate
        // copy of the final visible frame, shown only after real playback ends.
        still = $.CreatePanel("Image", host, "GurrenLockStill", {
            src: stem + "-LastFrame.png", scaling: "stretch", hittest: "false"
        });
        still.style.width = "100%"; still.style.height = "100%"; still.visible = false;
        movie = $.CreatePanel("Movie", host, "GurrenLockMovie", {
            src: stem + ".webm", autoplay: "onload", repeat: "false",
            scaling: "stretch", disableaudio: "false", muted: "false",
            playback_volume: "1.0", disableactivatepause: "true", controls: "none",
            hittest: "false", hittestchildren: "false"
        });
        if (!movie || !movie.IsValid()) throw new Error("Movie creation failed");
        var observed = movie;
        activeHero = hero; age = 0;
        movie.AddClass("GurrenLockMovie");
        movie.style.width = "100%"; movie.style.height = "100%";
        movie.style.horizontalAlign = "center"; movie.style.verticalAlign = "center";
        if (typeof movie.SetRepeat === "function") movie.SetRepeat(false);
        if (typeof movie.SetPlaybackVolume === "function") movie.SetPlaybackVolume(1.0);
        // src + autoplay initialize playback. Do not reassign src/SetMovie:
        // doing so can restart the decoder during initialization.
        var finished = false, playbackStarted = false, timerGeneration = 0;
        var duration = clips[hero].duration;
        function finish() {
            if (token !== session || activeHero !== hero || finished) return;
            if (!still || !still.IsValid()) return;
            finished = true;
            still.visible = true;
            // Release the decoder instead of leaving its cleared EOF texture
            // in front of the final image. Keep activeHero to prevent replay.
            if (observed && observed.IsValid()) {
                observed.visible = false;
                observed.DeleteAsync(0);
            }
            movie = null;
            $.Msg("[GurrenLock] Holding final frame: " + hero);
        }
        function scheduleFinish(delay) {
            var generation = ++timerGeneration;
            $.Schedule(delay, function () {
                if (generation === timerGeneration) finish();
            });
        }
        function started() {
            if (token !== session || playbackStarted || finished) return;
            playbackStarted = true;
            // When emitted, the native playback event anchors the timer to
            // actual playback rather than panel creation.
            scheduleFinish(Math.max(0, duration - 1 / 30));
        }
        function ended() {
            // Some clients emit Ended while initializing an empty decoder.
            if (age < duration - 0.1) return;
            finish();
        }
        function hook(panel, name, fn) {
            if (typeof $.RegisterEventHandler !== "function") return;
            try { $.RegisterEventHandler(name, panel, fn); } catch (_) {}
        }
        hook(movie, "MoviePlayerPlaybackStart", started);
        hook(movie, "MoviePlayerPlaybackEnded", ended);
        hook(movie, "VideoPlayerEnded", ended);
        hook(movie, "MoviePlayerAudioStart", function () {
            if (token === session) $.Msg("[GurrenLock] Audio started: " + hero);
        });
        $.Schedule(0.1, function () {
            if (token !== session || !observed.IsValid()) return;
            var picture = observed.FindChildTraverse("MoviePanel");
            if (picture && picture.IsValid()) {
                picture.style.width = "100%"; picture.style.height = "100%";
                hook(picture, "VideoPlayerEnded", ended);
            }
        });
        // Fallback for clients that never emit playback/end events.
        scheduleFinish(duration);
        host.visible = true;
        $.Msg("[GurrenLock] Playing " + hero + ": " + stem + ".webm");
    }

    function tick() {
        if (!root || !root.IsValid()) return;
        var hero = "";
        try {
            if (visible()) hero = selectedHero();
            else failedHero = "";
            // No matching clip means the native interface stays visible.
            if (activeHero && hero !== activeHero) removeMovie();
            if (hero !== pendingHero) { pendingHero = hero; stableTicks = 0; }
            else stableTicks++;
            if (hero && !activeHero && hero !== failedHero && stableTicks >= 2) begin(hero);
            if (activeHero) age += 0.1;
        } catch (error) {
            removeMovie(); failedHero = hero;
            $.Msg("[GurrenLock] Fallback to vanilla: " + error);
        }
        $.Schedule(0.1, tick);
    }
    $.Msg("[GurrenLock] Hero-specific loading initialized (22 heroes)");
    $.Schedule(0.0, tick);
})();
