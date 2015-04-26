<?php snippet('site/code-header') ?>
<?php snippet('site/header') ?>

<h1><?php echo $page->title() ?></h1>
<?php echo $page->intro()->kirbytext() ?>

<h2>Overview</h2>

<?php $metadata = yaml($page->overview()) ?>
<?php foreach($metadata as $key => $section):?>
	<h3><?php echo $key ?></h3>
	<?php echo kirbytext($section) ?>
<?php endforeach ?>

<?php foreach($page->children() as $section): ?>
	<?php snippet('project/' . $section->uid(), array('section' => $section)) ?>
<?php endforeach ?>


<?php 
	$prev = $page->prev();
	$next = $page->next();
	if (!$prev) $prev = $pages->find('work')->children()->visible()->last();
	if (!$next) $next = $pages->find('work')->children()->visible()->first();
?>
<?php snippet('project/pagination', array('prev' => $prev, 'next' => $next)) ?>

<?php snippet('site/footer') ?>
<?php snippet('site/code-footer') ?>