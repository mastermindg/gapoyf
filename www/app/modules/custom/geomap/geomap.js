// Create global variables to hold onto the coordinates and the map.
var _geomap_user_latitude = null;
var _geomap_user_longitude = null;
var _geomap_map = null;
var infowindow = null;

/**
 * Implements hook_menu().
 */
function geomap_menu() {
  try {
    var items = {};
    items['map'] = {
      title: 'Search',
      page_callback: 'drupalgap_get_form',
      page_arguments: ['geomap_form'],
      pageshow: 'geomap_pageshow'
    };
    return items;
  }
  catch (error) { console.log('geomap_menu - ' + error); }
}

/**
 * The map page callback.
 * Form added.
 */
function geomap_form(form, form_state) {
  try {
    form.elements['searchfield'] = {
		type: 'textfield',
		default_value: 'Enter Address...',
		attributes: {
			onkeypress: "drupalgap_form_onkeypress('" + form.id + "')"
		},
		prefix: '<div class="ui-grid-a"><div class="ui-block-a">',
		suffix: '</div><!-- block a -->'
	};
    form.elements['submit'] = {
		type: 'submit',
		value: 'Search its',
		  prefix: '<div class="ui-block-b">',
		  suffix: '</div><!-- block b --></div><!-- grid a -->'
	};     
    var map_attributes = {
      id: 'geomap_map',
      style: 'width: 100%; height: 320px;'
    };
    form.elements['map'] = {
      markup: '<div ' + drupalgap_attributes(map_attributes) + '></div>'
    };
    return form;
  }
  catch (error) { console.log('geomap_map_form - ' + error); }
}

/**
 * Define the form's submit function.
 */
function geomap_form_submit(form, form_state) {
  try {
    drupalgap_alert('Hello ' + form_state.values['name'] + '!');
  }
  catch (error) { console.log('geomap_form_submit - ' + error); }
}


/**
 * Build markers for stores authomatically on page load
 */
function geomap_refresh() {
	cordinates = _geomap_map.getCenter();
}	

/**
 * Build markers for stores authomatically on page load
 */
function geomap_pageshow() {
  try {
    navigator.geolocation.getCurrentPosition(
      
      // Success.
      function(position) {

        // Set aside the user's position.
        _geomap_user_latitude = position.coords.latitude;
        _geomap_user_longitude = position.coords.longitude;
        
        // Build the lat lng object from the user's current position.
        var myLatlng = new google.maps.LatLng(
          _geomap_user_latitude,
          _geomap_user_longitude
        );
        
        // Set the map's options.
        var mapOptions = {
          center: myLatlng,
          zoom: 12,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
          },
          zoomControl: true,
          zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
          }
        };
        
        // Initialize the map, and set a timeout to resize it properly.
        _geomap_map = new google.maps.Map(
          document.getElementById("geomap_map"),
          mapOptions
        );
        setTimeout(function() {
            google.maps.event.trigger(_geomap_map, 'resize');
            _geomap_map.setCenter(myLatlng);
        }, 500);
    
    try {    
    // Build the path to the view to retrieve the results.
    var range = 4; // Search within a 4 mile radius, for illustration purposes.
    var path = 'nearby-locations.json/' +
      _geomap_user_latitude + ',' + _geomap_user_longitude + '_' + range;
      
    // Call the server.
    views_datasource_get_view_result(path, {
        success: function(data) {
          
          if (data.nodes.length == 0) {
            drupalgap_alert('Sorry, we did not find any nearby locations!');
            return;
          }

          // Iterate over each spot, add it to the list and place a marker on the map.
          var items = [];
          $.each(data.nodes, function(index, object) {
 // Render a nearby location, and add it to the item list.
              var row = object.node;
              var image_html = theme('image', { path: row.field_store_marker_image.src });
              var distance =
                row.field_geofield_distance + ' ' +
                drupalgap_format_plural(row.field_geofield_distance, 'mile', 'miles');
              var description =
                '<h2>' + distance + '</h2>' +
                '<p>' + row.title + '</p>';
              var link = l(image_html + description, 'node/' + row.nid);
              items.push(link);
              
              // Add a marker on the map for the location.
              var locationLatlng = new google.maps.LatLng(row.latitude, row.longitude);
              var marker = new google.maps.Marker({
                  position: locationLatlng,
                  map: _geomap_map,
                  data: row
              });
              
              // Add an infowindow
			  google.maps.event.addListener(marker, 'click', function() {
				if (infowindow) infowindow.close();
				infowindow = new google.maps.InfoWindow({
					content: '<a href="node/' + row.nid + '">' + row.title + '</a><br/>' + 'Distance: ' + distance
				});
				infowindow.open(_geomap_map, marker);
			  });
              
          });
          drupalgap_item_list_populate("#location_results_list", items);
     
        }
    });

		} // Inner Try  
		catch (error) { console.log('_geomap_button_click - ' + error); }
      }, // Function to build map
      
            // Error
      function(error) {
        
        // Provide debug information to developer and user.
        console.log(error);
        drupalgap_alert(error.message);
        
        // Process error code.
        switch (error.code) {

          // PERMISSION_DENIED
          case 1:
            break;

          // POSITION_UNAVAILABLE
          case 2:
            break;

          // TIMEOUT
          case 3:
            break;

        }

      },
      
      // Options
      { enableHighAccuracy: true }
      
    );
  } //outer Try
  catch (error) { console.log('geomap_map_pageshow - ' + error); }

}

/**
 * The "Find Nearby Locations" click handler.
 */
function _geomap_button_click() {
  try {
    // Build the path to the view to retrieve the results.
    var range = 10; // Search within a 4 mile radius, for illustration purposes.
    var path = 'nearby-locations.json/' +
      _geomap_user_latitude + ',' + _geomap_user_longitude + '_' + range;
      
    // Call the server.
    views_datasource_get_view_result(path, {
        success: function(data) {
          
          if (data.nodes.length == 0) {
            drupalgap_alert('Sorry, we did not find any nearby locations!');
            return;
          }

          // Iterate over each spot, add it to the list and place a marker on the map.
          var items = [];
          $.each(data.nodes, function(index, object) {
 // Render a nearby location, and add it to the item list.
              var row = object.node;
              var image_html = theme('image', { path: rowfield_store_marker_image.src });
              var distance =
                row.field_geofield_distance + ' ' +
                drupalgap_format_plural(row.field_geofield_distance, 'mile', 'miles');
              var description =
                '<h2>' + distance + '</h2>' +
                '<p>' + row.title + '</p>';
              var link = l(image_html + description, 'node/' + row.nid);
              items.push(link);
              
              // Add a marker on the map for the location.
              var locationLatlng = new google.maps.LatLng(row.latitude, row.longitude);
              var marker = new google.maps.Marker({
                  position: locationLatlng,
                  map: _geomap_map,
                  data: row
              });
              
          });
          drupalgap_item_list_populate("#location_results_list", items);
     
        }
    });
  }
  catch (error) { console.log('_geomap_button_click - ' + error); }
}     


/**
 * The map pageshow callback old
 */
function geomap_map_pageshow_old() {
  try {
    navigator.geolocation.getCurrentPosition(
      
      // Success.
      function(position) {

        // Set aside the user's position.
        _geomap_user_latitude = position.coords.latitude;
        _geomap_user_longitude = position.coords.longitude;
        
        // Build the lat lng object from the user's current position.
        var myLatlng = new google.maps.LatLng(
          _geomap_user_latitude,
          _geomap_user_longitude
        );
        
        // Set the map's options.
        var mapOptions = {
          center: myLatlng,
          zoom: 11,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
          },
          zoomControl: true,
          zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
          }
        };
        
        // Initialize the map, and set a timeout to resize it properly.
        _geomap_map = new google.maps.Map(
          document.getElementById("geomap_map"),
          mapOptions
        );
        setTimeout(function() {
            google.maps.event.trigger(_geomap_map, 'resize');
            _geomap_map.setCenter(myLatlng);
        }, 500);
        
        // Add a marker for the user's current position.
        var marker = new google.maps.Marker({
            position: myLatlng,
            map: _geomap_map,
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        });
        
      },
      
            // Error
      function(error) {
        
        // Provide debug information to developer and user.
        console.log(error);
        drupalgap_alert(error.message);
        
        // Process error code.
        switch (error.code) {

          // PERMISSION_DENIED
          case 1:
            break;

          // POSITION_UNAVAILABLE
          case 2:
            break;

          // TIMEOUT
          case 3:
            break;

        }

      },
      
      // Options
      { enableHighAccuracy: true }
      
    );
  }
  catch (error) { console.log('geomap_map_pageshow - ' + error); }
}


/**
 * The map page callback.
 */
function geomap_map_old() {
  try {
    var content = {};
    content['find_nearby_locations'] = {
		theme: 'textfield',
		text: 'Enter Address...',
		attributes: {
			onclick: "_geomap_button_click()",
			'data-theme': 'b'
		}
	};    
    var map_attributes = {
      id: 'geomap_map',
      style: 'width: 100%; height: 320px;'
    };
    content['map'] = {
      markup: '<div ' + drupalgap_attributes(map_attributes) + '></div>'
    };
    content['location_results'] = {
		theme: 'jqm_item_list',
		items: [],
		attributes: {
			id: 'location_results_list'
		}	
	};
    return content;
  }
  catch (error) { console.log('geomap_map - ' + error); }
}

/**
 * The "Find Nearby Locations" click handler.
 */
function _geomap_button_click_old() {
  try {
    // Build the path to the view to retrieve the results.
    var range = 4; // Search within a 4 mile radius, for illustration purposes.
    var path = 'nearby-locations.json/' +
      _geomap_user_latitude + ',' + _geomap_user_longitude + '_' + range;
      
    // Call the server.
    views_datasource_get_view_result(path, {
        success: function(data) {
          
          if (data.nodes.length == 0) {
            drupalgap_alert('Sorry, we did not find any nearby locations!');
            return;
          }

          // Iterate over each spot, add it to the list and place a marker on the map.
          var items = [];
          $.each(data.nodes, function(index, object) {
 // Render a nearby location, and add it to the item list.
              var row = object.node;
              var image_html = theme('image', { path: rowfield_store_marker_image.src });
              var distance =
                row.field_geofield_distance + ' ' +
                drupalgap_format_plural(row.field_geofield_distance, 'mile', 'miles');
              var description =
                '<h2>' + distance + '</h2>' +
                '<p>' + row.title + '</p>';
              var link = l(image_html + description, 'node/' + row.nid);
              items.push(link);
              
              // Add a marker on the map for the location.
              var locationLatlng = new google.maps.LatLng(row.latitude, row.longitude);
              var marker = new google.maps.Marker({
                  position: locationLatlng,
                  map: _geomap_map,
                  data: row
              });
              
          });
          drupalgap_item_list_populate("#location_results_list", items);
     
        }
    });
  }
  catch (error) { console.log('_geomap_button_click - ' + error); }
}     
