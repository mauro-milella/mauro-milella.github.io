var direction_i = 0,
$window = $(window);

$(document).scroll(function() {
    hr_scroll();
    floating_scroll();
});

function hr_scroll() {
    var scroll_top = $window.scrollTop();
    direction = (scroll_top > direction_i) ? 'up' : 'down';
    direction_i = scroll_top;

    $('.fancyhr').each(function() {
        var $this = $(this);
        from_top = $this.offset().top - scroll_top - 100;

        if (from_top < 300 && from_top > 0) {
            $this.css('width', (100 - (from_top/600) * 100) + '%');
        }
    });
}

function floating_scroll() {
    var scroll_top = $window.scrollTop();
    direction = (scroll_top > direction_i) ? 'up' : 'down';
    direction_i = scroll_top;

    $('.floating').each(function() {
        var $this = $(this);
        from_top = $this.offset().top - scroll_top - 100;
        new_pos = (100 - (from_top/300) * 100);
        if(new_pos > 0) {
            new_pos = 0;
        }
        if(new_pos < -20) {
            new_pos = -20;
        }
        $this.css('top', new_pos + 'px');
        
        console.log((100 - (from_top/600) * 100));
    });
}

hr_scroll();
floating_scroll();