$(function () {
    $(".header__nav-links a, .header-top-btn, .footer__nav a").on("click", function (e) {
        e.preventDefault()
        var id = $(this).attr('href'),
            top = $(id).offset().top
        $('body,html').animate({ scrollTop: top }, 800)
    })

    setInterval(() => {
        if ($(window).scrollTop() > 0 && $('.header-top').hasClass('header-top--opened') === false) {
            $('.burger').addClass('burger--follow')
        } else {
            $('.burger').removeClass('burger--follow')
        }
    }, 0)
    $('.burger, .overlay').on('click', function (e) {
        e.preventDefault()
        $('.header-top').toggleClass('header-top--opened')
        $('.overlay').toggleClass('overlay--opened')
    })
    var mixer = mixitup('.catalog__products');

    $('.genres__list-filter').on('click', function () {
        $('.genres__list-filter').removeClass('genres__list-filter--active')
        $(this).addClass('genres__filter--active')
    })
});

var check = false;
function changeVal(el) {
    var qt = parseFloat(el.parent().children(".product__qt").html());
    var price = parseFloat(el.parent().children(".product__price").html());
    var eq = Math.round(price * qt * 100) / 100;
    el.parent().children(".product__full-price").html(eq + "€");
    changeTotal();
}
function changeTotal() {
    var price = 0;
    $(".product__full-price").each(function (index) {
        price += parseFloat($(".product__full-price").eq(index).html());
    });
    price = Math.round(price * 100) / 100;
    var tax = Math.round(price * 0.05 * 100) / 100
    var shipping = parseFloat($(".shipping span").html());
    var fullPrice = Math.round((price + tax + shipping) * 100) / 100;
    if (price == 0) {
        fullPrice = 0;
    }
    $(".subtotal span").html(price);
    $(".tax span").html(tax);
    $(".total span").html(fullPrice);
}
$(document).ready(function () {
    $(".product__remove").click(function () {
        var el = $(this);
        el.parent().parent().addClass("removed");
        window.setTimeout(
            function () {
                el.parent().parent().slideUp('fast', function () {
                    el.parent().parent().remove();
                    if ($(".product").length == 0) {
                        if (check) {
                            $("#cart").html("<h1>The shop does not function, yet!</h1><p>If you liked my shopping cart, please take a second and heart this Pen on <a href='https://codepen.io/ziga-miklic/pen/xhpob'>CodePen</a>. Thank you!</p>");
                        } else {
                            $("#cart").html("<h1>No products!</h1>");
                        }
                    }
                    changeTotal();
                });
            }, 200);
    });
    $(".product__qt-plus").click(function () {
        $(this).parent().children(".product__qt").html(parseInt($(this).parent().children(".product__qt").html()) + 1);
        $(this).parent().children(".product__full-price").addClass("added");
        var el = $(this);
        window.setTimeout(function () { el.parent().children(".product__full-price").removeClass("added"); changeVal(el); }, 150);
    });
    $(".product__qt-minus").click(function () {
        child = $(this).parent().children(".product__qt");
        if (parseInt(child.html()) > 1) {
            child.html(parseInt(child.html()) - 1);
        }
        $(this).parent().children(".product__full-price").addClass("minused");
        var el = $(this);
        window.setTimeout(function () { el.parent().children(".product__full-price").removeClass("minused"); changeVal(el); }, 150);
    });
    window.setTimeout(function () { $(".is-open").removeClass("is-open") }, 1200);
    $(".btn").click(function () {
        check = true;
        $(".remove").click();
    });
});