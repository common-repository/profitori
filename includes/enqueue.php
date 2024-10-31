<?php
// This file enqueues scripts and styles

defined( 'ABSPATH' ) or die( 'Direct script access disallowed.' );

function prfi_cook_path($path) {
  $folder = basename(PRFI__PLUGIN_DIR);
  return str_replace('/wp-content/plugins/profitori', '/wp-content/plugins/' . $folder, $path);
}

add_action( 'init', function() {

  add_filter( 'script_loader_tag', function( $tag, $handle ) {
    if ( ! preg_match( '/^profitori-/', $handle ) ) { return $tag; }
    return str_replace( ' src', ' async defer src', $tag );
  }, 10, 2 );

  add_action( 'admin_enqueue_scripts', function() {
    if ( ! strpos($_SERVER['REQUEST_URI'], 'page=profitori') ) return;
    $asset_manifest = json_decode( prfi_file_get_contents( PRFI_ASSET_MANIFEST ), true )['files'];

    if ( isset( $asset_manifest[ 'main.css' ] ) ) {
      wp_enqueue_style( 'profitori', get_site_url() . prfi_cook_path($asset_manifest[ 'main.css' ]) );
    }

    $url = get_site_url();
    $am =  $asset_manifest[ 'runtime-main.js' ];
    wp_enqueue_script( 'profitori-runtime', get_site_url() . prfi_cook_path($am), array(), null, true );

    wp_enqueue_script( 'profitori-main', get_site_url() . prfi_cook_path($asset_manifest[ 'main.js' ]), array('profitori-runtime'), null, true );

    foreach ( $asset_manifest as $key => $value ) {
      if ( preg_match( '@static/js/(.*)\.chunk\.js@', $key, $matches ) ) {
        if ( $matches && is_array( $matches ) && count( $matches ) === 2 ) {
          $name = "profitori-" . preg_replace( '/[^A-Za-z0-9_]/', '-', $matches[1] );
          wp_enqueue_script( $name, get_site_url() . prfi_cook_path($value), array( 'profitori-main' ), null, true );
        }
      }

      if ( preg_match( '@static/css/(.*)\.chunk\.css@', $key, $matches ) ) {
        if ( $matches && is_array( $matches ) && count( $matches ) == 2 ) {
          $name = "profitori-" . preg_replace( '/[^A-Za-z0-9_]/', '-', $matches[1] );
          wp_enqueue_style( $name, get_site_url() . prfi_cook_path($value), array( 'profitori' ), null );
        }
      }
    }
  });
});
