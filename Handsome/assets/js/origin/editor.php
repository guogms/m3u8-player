<?php

$config=Typecho_Widget::widget('Widget_Options')->plugin('Handsome');
include __DIR__.'/editor-js.php';
function initEditor($post){
	initChoice($post);
}
initEditor($content);
