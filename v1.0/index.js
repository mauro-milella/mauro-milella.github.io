//Window resize handler
$(window).resize(function(){
    if($(this).width() > 768)
        transformNavbar();
})

//Responsive navbar behaviour
function transformNavbar(){
    $(".nav-mobile-screen").removeClass("nav-in");
    $(".nav-mobile-screen").removeClass("nav-out");

    $(".nav-icon").removeClass("down-direction");
}

function toggleNavMobileScreen(){
    const obj = $(".nav-mobile-screen");
    obj.toggleClass("nav-in");

    if(!obj.hasClass("nav-in"))
        obj.toggleClass("nav-out");
    else
        obj.removeClass("nav-out");
    
    $(".nav-icon").toggleClass("down-direction")
}

$("#mobile-nav-button").click( toggleNavMobileScreen );
$(".nav-li").click( toggleNavMobileScreen );

var faq = document.getElementsByClassName("faq-page");
var i;
for (i = 0; i < faq.length; i++) {
    faq[i].addEventListener("click", function () {
        /* Toggle between adding and removing the "active" class,
        to highlight the button that controls the panel */
        this.classList.toggle("active");
        /* Toggle between hiding and showing the active panel */
        var body = this.nextElementSibling;
        if (body.style.display === "block") {
            body.style.display = "none";
        } else {
            body.style.display = "block";
        }
    });
}