var animationSpeed = 800;
var easing = 'swing';
var animating = false;
var menuSelector = '#chapter-flyout';
var textSelector = '#text';
var talesFolder = 'tales/';
var defaultPageTitle = document.title;
var talesMap = {};
var talesSummaryMap = {};

function previous() {
	if (!animating) {
		var left = parseInt($(textSelector).css('left'));
		var columnWidth =  $(textSelector).data('column-width');
		var newLeft = Number(left) + Number(columnWidth);
		if (newLeft <= 0) {
			animating = true;
			$(textSelector).animate({left: newLeft}, animationSpeed, easing, function() {
				var page = Number($(textSelector).data('page')) - 1;
				$(textSelector).data('page', page);
				$(textSelector).attr('data-page', page);
				var taleName = window.location.search.substring(1).split('&')[0].split('=')[1];
				window.history.pushState({}, "Page " + page + ", Tale: " + taleName, '?tale=' + taleName + '&page=' + page);
				animating = false;
			});
		}
	}
};

function next() {
	if (!animating) {
		var left = parseInt($(textSelector).css('left'));
		var columnWidth =  $(textSelector).data('column-width');
		var newLeft = Number(left) - Number(columnWidth);
		var maxLeft = $(textSelector).width() * -1;
		if (newLeft > maxLeft) {
			animating = true;
			$(textSelector).animate({left: newLeft}, animationSpeed, easing, function() {
				var page = Number($(textSelector).data('page')) + 1;
				$(textSelector).data('page', page);
				$(textSelector).attr('data-page', page);
				var taleName = window.location.search.substring(1).split('&')[0].split('=')[1];
				window.history.pushState({}, "Page " + page + ", Tale: " + taleName, '?tale=' + taleName + '&page=' + page);
				animating = false;
			});
		}
	}
};

function showPage(page) {
	var columnWidth =  $(textSelector).data('column-width');
	var maxLeft = $(textSelector).width() * -1;
	var newLeft = (Number(page) - 1) * Number(columnWidth) * -1;
	if (newLeft > maxLeft && newLeft <= 0) {
		$(textSelector).css('left', newLeft);
		$(textSelector).data('page', page);
		$(textSelector).attr('data-page', page);
	}
};

function formatTale(page) {
	var contentHeight = $('#content').height();
	var textHeight = $(textSelector).height() - 10;
	var textWidth = $(textSelector).outerWidth();
	var numberOfColumns = Math.ceil(textHeight / contentHeight);
	$(textSelector).css('column-count', numberOfColumns);
	$(textSelector).css('width', textWidth * numberOfColumns);
	$(textSelector).css('height', '100%');
	$(textSelector).data('column-width', textWidth);
	$(textSelector).attr('data-column-width', textWidth);
	$(textSelector).data('page', 1);
	$(textSelector).attr('data-page', 1);
	showPage(page);
};

function loadTale(tale, page) {
	// reset
	$(textSelector).css('left', 0);
	$(textSelector).css('column-count', 'initial');
	$(textSelector).css('width', 'initial');
	$(textSelector).css('height', 'initial');
	$(textSelector).data('column-width', '');
	$(textSelector).attr('data-column-width', '');
	$(textSelector).data('page', '');
	$(textSelector).attr('data-page', '');
	window.history.pushState({}, "RESET", '/');
	
	var taleName = talesMap[tale];
	if (taleName != undefined) {
		document.title = defaultPageTitle + ' - ' + taleName;
	}
	window.history.pushState({}, "Page " + page + ", Tale: " + tale, '?tale=' + tale + '&page=' + page);
	var fileType = tale.substring(tale.indexOf('.') + 1, tale.length);
	switch(fileType) {
		case 'md':
			$(textSelector).load(talesFolder + tale, function() {
				var converter = new showdown.Converter();
				var md = $(textSelector).html();
				$(textSelector).html(converter.makeHtml(md));
				formatTale(page);
			});
			break;
		case 'htm':
		case 'html':
		default:
			$(textSelector).load(talesFolder + tale, function() {
				formatTale(page);
			});
			break;
	}
};

function buildMenu(tales) {
	tales.sort(function(tale1, tale2) { 
		return tale1.order - tale2.order;
	})
	
	var list = $(menuSelector + '>div.left>ul');
	$.each(tales, function() {
		talesMap[this.file] = this.name;
		talesSummaryMap[this.file] = this.summary;
		list.append('<li data-link="' + this.file + '">' + this.name + '</li>');
	});
	
	$('#menu>#chapters').mouseenter(function() {
		$(menuSelector).show();
	});
	
	$('#menu>#chapters').mouseleave(function() {
		$(menuSelector).hide();
	});
	
	$(menuSelector + '>div.left>ul>li').hover(function() {
		var taleLink = $(this).data('link');
		var summary = talesSummaryMap[taleLink];
		$('.summary').html(summary);
	}).click(function() {
		var taleLink = $(this).data('link');
		loadTale(taleLink, 1);
	});
};

function loadToc() {
	$.getJSON(talesFolder + 'toc.json', function(data) {
		if (window.location.search == '') {
			loadTale(data.initialTale, 1);
		} else {
			parseUrlParameters();
		}
		buildMenu(data.tales);
	}).fail(function(data) {
		console.log('GetJSON failed: ' + JSON.stringify(data));
	});
};

function parseUrlParameters() {
	var tale = '';
	var page = 1;
	var params = window.location.search.substring(1).split('&');
	$.each(params, function() {
		var keyValue = this.split('=');
		if (keyValue[0] === 'tale') {
			tale = keyValue[1];
		}
		if (keyValue[0] === 'page') {
			page = keyValue[1];
		}
	});
	loadTale(tale, page);
};

$(document).ready(function() {
	loadToc();
	
	$('#menu>#previous').click(previous);
	
	$('#menu>#next').click(next);
	
	$(document).keydown(function(e) {
		switch(e.which) {
			case 37: // left
			previous();
			break;

			case 39: // right
			next();
			break;

			default: return; // exit this handler for other keys
		}
		e.preventDefault(); // prevent the default action (scroll / move caret)
	});
});