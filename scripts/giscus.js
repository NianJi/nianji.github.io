/* global hexo */

'use strict';

// Add giscus comment support for NexT theme
hexo.extend.filter.register('theme_inject', injects => {
  const config = hexo.theme.config.giscus;
  if (!config || !config.enable) return;

  if (!config.repo) {
    hexo.log.warn('giscus.repo can\'t be null.');
    return;
  }

  if (!config.repo_id) {
    hexo.log.warn('giscus.repo_id can\'t be null.');
    return;
  }

  if (!config.category_id) {
    hexo.log.warn('giscus.category_id can\'t be null.');
    return;
  }

  // Inject comment container
  injects.comment.raw('giscus', '<div class="comments giscus-container"></div>', {}, { cache: true });

  // Inject giscus script
  const giscusScript = `
<script>
  document.addEventListener('page:loaded', function() {
    if (!CONFIG.page.comments) return;
    
    NexT.utils.loadComments('.giscus-container').then(function() {
      var giscusScript = document.createElement('script');
      giscusScript.src = 'https://giscus.app/client.js';
      giscusScript.setAttribute('data-repo', '${config.repo}');
      giscusScript.setAttribute('data-repo-id', '${config.repo_id}');
      giscusScript.setAttribute('data-category', '${config.category || ''}');
      giscusScript.setAttribute('data-category-id', '${config.category_id}');
      giscusScript.setAttribute('data-mapping', '${config.mapping || 'pathname'}');
      giscusScript.setAttribute('data-strict', '${config.strict || '0'}');
      giscusScript.setAttribute('data-reactions-enabled', '${config.reactions_enabled || '1'}');
      giscusScript.setAttribute('data-emit-metadata', '${config.emit_metadata || '0'}');
      giscusScript.setAttribute('data-input-position', '${config.input_position || 'bottom'}');
      giscusScript.setAttribute('data-theme', '${config.theme || 'preferred_color_scheme'}');
      giscusScript.setAttribute('data-lang', '${config.lang || 'zh-CN'}');
      giscusScript.setAttribute('data-loading', '${config.loading || 'lazy'}');
      giscusScript.setAttribute('crossorigin', '${config.crossorigin || 'anonymous'}');
      giscusScript.async = true;
      
      document.querySelector('.giscus-container').appendChild(giscusScript);
    });
  });
</script>
  `.trim();

  injects.bodyEnd.raw('giscus', giscusScript, {}, { cache: true });
});

