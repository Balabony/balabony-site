<?php
// 11.11.2026: новина-анонс гри «Моя Україна на мапі» на lvivdim.com
$title = 'Моя Україна на мапі — безкоштовна гра для школярів про міста, історію й памʼять України';
$ex = get_page_by_title($title, OBJECT, 'post');
if ($ex) { echo "EXISTS: ".get_permalink($ex->ID)."\n"; return; }
$c = <<<HTML
<!-- wp:paragraph {"fontSize":"large"} -->
<p class="has-large-font-size">Запускаємо безкоштовну онлайн-гру для учнів 5–11 класів <strong>«Моя Україна на мапі»</strong>. Вона допомагає дітям краще знати рідну країну: її міста, історію, культуру й памʼять.</p>
<!-- /wp:paragraph -->
<!-- wp:buttons --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://balabony.com/moia-ukraina" target="_blank" rel="noopener">Грати зараз</a></div><!-- /wp:button --></div><!-- /wp:buttons -->
<!-- wp:heading --><h2 class="wp-block-heading">Що є в грі</h2><!-- /wp:heading -->
<!-- wp:list --><ul class="wp-block-list">
<li><strong>Вікторина.</strong> Понад 100 запитань у пʼяти темах: історія, памʼять, культура, природа й держава. Після кожної відповіді — коротке пояснення і місто на мапі.</li>
<li><strong>«Знайди місто на мапі».</strong> Торкнись мапи там, де, на твою думку, назване місто, — і дізнаєшся, на скільки кілометрів помилився.</li>
<li><strong>«Моя мапа».</strong> Нитка від рідного міста до того, де дитина живе зараз, і відстань між ними. Окуповані міста позначено: «Памʼятаємо і повернемося».</li>
<li><strong>Інтерактивна мапа України</strong> з річками, морями, Карпатами й особливостями кожної області.</li>
<li><strong>Рейтинг шкіл.</strong> Бали всіх учнів школи додаються — грайте класом.</li>
<li><strong>«Запропонуй запитання про своє місто».</strong> Найкращі запитання учнів після перевірки потрапляють у гру з іменем автора.</li>
</ul><!-- /wp:list -->
<!-- wp:heading --><h2 class="wp-block-heading">Для вчителів</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>Гра підходить для класних годин, уроків історії й географії: учитель показує її на проєкторі, клас відповідає разом. Реєстрація не потрібна, персональних даних дітей ми не збираємо. Гра працює з клавіатури, має режим «більше часу» для тих, кому потрібно довше подумати.</p><!-- /wp:paragraph -->
<!-- wp:paragraph --><p>Гра — частина проєкту «Моє місце: голоси молоді України», який наша організація готує разом із дітьми внутрішньо переміщених осіб і дітьми захисників. Діти досліджують свої рідні міста й самі створюють запитання для гри.</p><!-- /wp:paragraph -->
<!-- wp:paragraph --><p>Грати: <a href="https://balabony.com/moia-ukraina" target="_blank" rel="noopener">balabony.com/moia-ukraina</a></p><!-- /wp:paragraph -->
HTML;
$cat = get_category_by_slug('novyny');
$id = wp_insert_post(['post_title'=>$title,'post_content'=>$c,'post_status'=>'publish','post_type'=>'post','post_category'=>$cat?[$cat->term_id]:[],'post_excerpt'=>'Безкоштовна онлайн-гра для учнів 5–11 класів: понад 100 запитань про міста, історію й памʼять України, «Знайди місто на мапі» і рейтинг шкіл.']);
echo is_wp_error($id) ? "ERR ".$id->get_error_message()."\n" : "OK post ".get_permalink($id)."\n";
