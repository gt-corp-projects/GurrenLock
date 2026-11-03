// Record the actual panel that owns the player script after CustomLayoutPanel mounting.
(function () {
    var context = $.GetContextPanel();
    context.SetAttributeString("gurrenlock_preview_player", "ready");
    context.AddClass("State_HeroReveal");
    context.AddClass("HeroLoaded");
    context.RemoveClass("ShowPregame");
    $.Msg("[GurrenLock Preview v2] Player context registered: " + context.id);
})();
