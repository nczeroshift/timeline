
function Timeline(dom) {
    this._pDom = dom;
    this._pStart = 0;
    this._pDuration = 10;
    this._pWidth = 0;
    this._pSetup();
    this._pChangeCallback = null;
}

Timeline.prototype.setChangeCallback = function (cbk) {
    this._pChangeCallback = cbk;
}

Timeline.prototype.setStart = function (start) {
    this._pStart = start;
}

Timeline.prototype.setDuration = function (duration) {
    this._pDuration = duration;
}

Timeline.prototype.addSegment = function (id, start, duration, track, text) {
    var scope = this;

    var seg = $("<div class=\"tlSegment\"><div class=\"inner\"></div></div>");
    seg.attr({
        "data-id": id,
        "data-t": start,
        "data-duration": duration,
        "data-track": track
    });

    seg.find(".inner").html(text);

    this._pDom.find(".tlEditor").append(seg);

    seg.bind("mousedown", function (e) {
        scope._pSegment_MouseDown($(this), e);
    });

    return seg;
}

Timeline.prototype._pSetup = function () {
    var scope = this;
       
    var tracksDom = this._pDom.find(".tlEditor");

    tracksDom.bind("mousedown", function (e) {
        var self = $(this);

        var off = self.offset();
        var x = e.pageX - off.left;
        var y = e.pageY - off.top;

        self.attr("data-o_x", parseInt(x));
        self.attr("data-o_y", parseInt(y));
    });

    tracksDom.bind("mouseup", function (e) {
        var segs = tracksDom.find(".tlSegment");
        scope._pSegment_Clear(segs);
    });

    tracksDom.bind("mouseleave", function (e) {
        var segs = tracksDom.find(".tlSegment");
        scope._pSegment_Clear(segs);
    });

    tracksDom.bind("mousemove", function (e) {
        scope._pTrack_MouseMove($(this),e);
    });


    var timelineDom = this._pDom.find(".tlTrack");
    
    timelineDom.bind("mousedown", function (e) {
        var self = $(this);
        var off = self.offset();
        var x = e.pageX - off.left;
        var y = e.pageY - off.top;
        self.attr("data-o_x", parseInt(x));
        self.attr("data-o_y", parseInt(y));
        self.attr("data-o_start", scope._pStart);
        self.addClass("canDrag");
    }).bind("mouseup", function (e) {
        $(this).removeClass("canDrag");
    }).bind("mouseleave", function (e) {
        $(this).removeClass("canDrag");
    }).bind("mousemove", function (e) {
        var self = $(this);
        if (self.hasClass("canDrag")) {
            var off = self.offset();
            var x = e.pageX - off.left;
            var o_x = parseInt(self.attr("data-o_x"));
            var d_x = x - o_x;
            var w = self.width();
            var pixelsPerSecond = w / scope._pDuration;
            scope._pStart = parseFloat(self.attr("data-o_start")) - d_x / pixelsPerSecond;
            $(window).trigger("resize");
        }
    });

    function mouseWheelEvent(e) {
        scope._pEvent_MouseWheel($(this),e);
    }

    timelineDom[0].addEventListener("wheel", mouseWheelEvent);
    tracksDom[0].addEventListener("wheel", mouseWheelEvent);

    this._pResize();
}

Timeline.prototype._pResize = function () {
    this._pWidth = this._pDom.width();

    var timelineDom = this._pDom.find(".tlTrack");
    var tracksDom = $(".tlEditor");

    this._pTimeline_Render(timelineDom, this._pStart, this._pDuration);
    this._pTrack_Render(tracksDom, this._pStart, this._pDuration);

    var segments = tracksDom.find(".tlSegment");
    for (var i = 0; i < segments.length; i++) {
        this._pSegment_Update($(segments[i]));
    }
}

Timeline.prototype.resize = function(){
    this._pResize();
}

Timeline.prototype._pSegment_Clear = function (segs) {
    segs.removeClass("leftDrag");
    segs.removeClass("rightDrag");
    segs.removeClass("selected");
    segs.attr("data-o_x", null);
    segs.attr("data-o_y", null);
    segs.attr("data-o_w", null);
}

Timeline.prototype._pSegment_MouseDown = function (seg, event) {
    var w = seg.width();

    var dOff = this._pDom.find(".tlEditor").offset();
    var off = seg.offset();
    var x = event.pageX - off.left;
    var y = event.pageY - off.top;

    seg.removeClass("leftDrag");
    seg.removeClass("rightDrag");

    seg.attr("data-o_x", parseInt(off.left - dOff.left));
    seg.attr("data-o_y", parseInt(off.top - dOff.top));
    seg.attr("data-o_w", parseInt(w));

    if (x < 5)
        seg.addClass("leftDrag");
    else if (x > w - 5)
        seg.addClass("rightDrag");

   seg.addClass("selected");
}

Timeline.prototype._pSegment_Update = function (s) {
    var pixelsPerSecond = this._pWidth / this._pDuration;
      
    var seg_t = parseFloat(s.attr("data-t"));
    var seg_d = parseFloat(s.attr("data-duration"));
    var seg_trackId = !s.attr("data-track") ? 0 : parseInt(s.attr("data-track"));

    var x = (seg_t - this._pStart) * pixelsPerSecond;
    var w = seg_d * pixelsPerSecond;

    s.css({ left: x, width: w, top: seg_trackId * 20});    
}

Timeline.prototype._pEvent_MouseWheel = function (dom, e) {
    var off = dom.offset();
    var x = e.pageX - off.left;
    var y = e.pageY - off.top;

    var pixelsPerSecond =this._pWidth / this._pDuration;

    var cursor_t = this._pStart + x / pixelsPerSecond;

    var distance_t = cursor_t - this._pStart;
    var ndist_t = event.deltaY > 0 ? distance_t * 1.5 : distance_t / 1.5;
    var nstart = cursor_t - ndist_t;

    var dx = x / this._pWidth;

    var ndist_rem = (1 - dx) * (ndist_t) / dx;

    this._pStart = nstart;
    this._pDuration = ndist_t + ndist_rem;

    this._pResize();
}



Timeline.prototype._pTrack_MouseMove = function (track, e) {
    var off = track.offset();
    var x = e.pageX - off.left;
    var y = e.pageY - off.top;

    var dom_o_x = parseInt(track.attr("data-o_x"));
    var dom_o_y = parseInt(track.attr("data-o_y"));

    var segs = track.find(".tlSegment.selected");

    var pixelsPerSecond = this._pWidth / this._pDuration;

    for (var i = 0; i < segs.length; i++) {
        var s = $(segs[i]);
        var o_x = parseInt(s.attr("data-o_x"));
        var o_y = parseInt(s.attr("data-o_y"));
        var o_w = parseInt(s.attr("data-o_w"));

        var update_t = false;
        var update_dur = false;

        if (s.hasClass("rightDrag")) {
            s.css({ width: x - o_x });
            update_dur = true;
        }
        else if (s.hasClass("leftDrag")) {
            var o_end = o_x + o_w;
            var n_x = o_x + (x - dom_o_x);
            s.css({ width: o_end - n_x });
            s.css({ left: n_x });
            update_t = true;
            update_dur = true;
        }
        else {
            // o_y posição original do segmento
            var y = Math.floor((o_y + (y - dom_o_y) + 10) / 20) * 20;
            if (y < 0) y = 0;
            s.css({ top: y });
            s.css({ left: o_x + (x - dom_o_x) });
            update_t = true;
        }

        var w = parseInt(s.css("width"));
        var x = parseInt(s.css("left"));
        var y = parseInt(s.css("top"));

        var t_val = (x / pixelsPerSecond) + this._pStart;
        var t_dur =  w / pixelsPerSecond;
        var t_track = Math.floor(y / 20);
               
        if (update_t) s.attr("data-t", t_val);
        if (update_dur) s.attr("data-duration", t_dur);
        s.attr("data-track", t_track);

        if (this._pChangeCallback)
            this._pChangeCallback(s.attr("data-id"), t_val, t_dur, t_track);
    }
}


Timeline.prototype._pCanvas_GetContext = function (canvas) {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
}

function renderTrace(ctx, start, duration, height, pixelsPerSecond, step, y) {
    if (y == undefined) y = 0;
    for (var t = Math.floor(start / step) * step; t < start + duration; t += step) {
        var x = (t - start) * pixelsPerSecond;
        if (x < 0) continue;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
}


Timeline.prototype._pTrack_Render = function(timeline, start, duration) {
    var canvas = timeline.find("canvas");
    var width = timeline.width();
    var height = timeline.height();

    canvas.css({ width: width, height: height });

    var ctx = this._pCanvas_GetContext(canvas[0]);

    ctx.strokeStyle = "#BBB";
    for (var y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    var pixelsPerSecond = width / duration;
    var draw100thSecond = duration <= 10;
    var drawSeconds = duration <= 60;

    ctx.strokeStyle = "#A5A5A520";
    if (draw100thSecond)
        renderTrace(ctx, start, duration, height, pixelsPerSecond, 0.1);

    ctx.strokeStyle = "#7772";
    if (drawSeconds)
        renderTrace(ctx, start, duration, height, pixelsPerSecond, 1.0);

    ctx.strokeStyle = "#5552";
    renderTrace(ctx, start, duration, height, pixelsPerSecond, 10);

    ctx.strokeStyle = "#0002";
    renderTrace(ctx, start, duration, height, pixelsPerSecond, 30);
}

Timeline.prototype._pTimeline_Render = function(timeline, start, duration) {
    function pad(val) {
        return (val < 10 ? "0" : "") + val;
    }

    var canvas = timeline.find("canvas");
    var width = timeline.width();
    var height = timeline.height();
    canvas.css({ width: width, height: height });

    var ctx = this._pCanvas_GetContext(canvas[0]);

    var y = 14;

    var pixelsPerSecond = width / duration;
    var draw100thSecond = duration <= 10;
    var drawSeconds = duration <= 60;
    var draw10Seconds = true;
    var draw30Seconds = true;

    ctx.strokeStyle = "#A5A5A5";
    if (draw100thSecond)
        renderTrace(ctx, start, duration, height, pixelsPerSecond, 0.1, y);

    ctx.strokeStyle = "#777";
    if (drawSeconds)
        renderTrace(ctx, start, duration, height, pixelsPerSecond, 1.0, y);

    ctx.strokeStyle = "#555";
    renderTrace(ctx, start, duration, height, pixelsPerSecond, 10, y);

    ctx.strokeStyle = "#000";
    renderTrace(ctx, start, duration, height, pixelsPerSecond, 30, y);

    ctx.fillStyle = "#0009";

    var durationWidth = ctx.measureText("00:00").width;

    var steps = 1.0;
    if ((width * 60.0) / duration < durationWidth + 10)
        steps = 120.0;
    else if ((width * 30.0) / duration < durationWidth + 10)
        steps = 60.0;
    else if ((width * 10.0) / duration < durationWidth + 10)
        steps = 30.0;
    else if (width / duration < durationWidth + 10)
        steps = 10.0;

    var last_x = -100;
    for (var t = Math.floor(start / steps) * steps; t < start + duration; t += steps) {
        var x = (t - start) * pixelsPerSecond;
        if (x < 0) continue;

        var tt = t;
        var minus_str = "";
        if (tt < 0) {
            tt = -tt;
            minus_str = "-";
        }

        var minutes = Math.floor(tt / 60);
        var seconds = Math.floor(tt) % 60;
        var text = pad(minutes) + ":" + pad(seconds);
        var width = ctx.measureText(text).width;
        x -= width / 2;
        last_x = x + width + 10;
        ctx.fillText(minus_str + text, x, 10);
    }

}