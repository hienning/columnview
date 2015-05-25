/*
 * jquery.columnview.js
 *
 * https://github.com/hienning/columnview
 * Copyright (C) 2010 -	Hienning Lueng
 * Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
 * Version: 0.1.x-dev
 */


(function($){

	"use strict";

	function Plugin(selector, options)
	{
		this.options = options;

		this.selection = [];
		this.data = [];
		this.container = $(selector);
		this.columns = [];

		this._init(options);
	}



	Plugin.prototype = {

		_init: function(options) {
			this.options.url = options.url + '/';

			this.container
				.append('<table><thead><tr></tr></thead><tbody><tr></tr></tbody><tfoot><tr></tr></tfoot></table>');

			var i, _this = this;

			for (i=0; i<options.columns.length; i++) {
				this.addColumn(options.columns[i]);
			}

			this.container.find('table')
				.on('click', 'th .remove', function(e){
                    var col = $(this).parents('th').index();
                    return _this.options.onRemoveItem.call(this, col, e);
                })
				.on('click', '.item', function(e){
					return _this.onItemClicked(e, this);
				})
				.on('click', '.item .checkicon', function(e){
					return _this.onCheck(e, this);
				})
				.on('submit', 'tfoot .form-add', function(e){
					e.preventDefault();

                    var $name = $(this).find('.new-item-name');

                    _this.options.onCreateItem.call(
                        _this,
                        $name.val(),
                        $(this).parents('.column').index(),
                        e
                    );

                    $(this)[0].reset();
                    $name.focus();
                    return true;
				});
		},



		_setRemoveCount: function(col) {
			var i, count = 0;

			for (i=0; i<this.selection.length; i++) {
				if (this.selection[i].data().col === col) {
					count++;
				}
			}

			var $btn = this.container.find('table th:nth-child(' + (col+1) + ') .remove .caption')
						   .text(this.options.lang['btn-remove'].replace('{0}', ' ' + count + ' '))
						   .parent();

			$btn.css('visibility', (count <= 0 ? 'hidden' : 'visible'));
		},



		/**
		 * Append a new column to the right most.
		 *
		 * @param caption	string	Caption for the column.
		 */
		addColumn: function(caption) {
			var header = this.container.find('thead > tr'),
				footer = this.container.find('tfoot > tr'),
				body = this.container.find('tbody > tr');

			var $opt = $(
				'<th>' + caption + '<span class="opt">'
				+ '<a class="btn btn-xs remove"><i class="fa fa-remove"></i> <span class="caption">[btn-remove]</span></a>'
				+ '</span></th>'
			);


			$opt.find('.add .caption').text( this.options.lang['btn-add']).end()
				.find('.remove .caption').text(this.options.lang['btn-remove'].replace('{0}', ''))
				;

			header.append($opt);

			var $column = $('<td class="column"><ul></ul></td>');

			body.append($column);

			footer.append('<td><form class="form-add"><input type="hidden" name="parent"/>'
				+ '<div class="col-xs-9"><input class="form-control new-item-name" placeholder="'
				+ this.options.lang['input-new-column-name'] + '" /></div>'
				+ '<div class="col-xs-3"><button class="btn btn-block"><i class="fa fa-plus"></i> '
				+ this.options.lang['btn-add'] + '</button></div>'
				+ '</form></td>'
			);

			this.columns.push($column);
		},



		/**
		 * Fill a specified column with data.
		 *
		 * @param col		The column to be filled.
		 * @param data
		 */
		fillColumn: function(col, data) {
			if (col >= this.columns.length) {
				return;
			}

			var src = this.columns[col].find('ul');

			src.empty();

			for (var i=0; i<data.length; i++) {
				var $item = $('<li class="item" data-id="' + data[i].id + '">'
                            + '<div class="caption">' + data[i].title + '</div>'
							+ '<div class="checkicon">'
							+ '<i class="fa fa-square-o"></i><i class="fa fa-check-square-o"></i>&nbsp;'
							+ '</div>'
							+ (data[i].expandable ? '<i class="fa fa-chevron-right">' : '')
							+ '</i></li>');

				$item.appendTo(src).data({
					col: col,
					obj: data[i]
				});
			}
		},


        /**
         * Retrieve current selection.
         */
        getSelection: function(col) {
            if ('undefined' === typeof col) {

            }


        },



		/**
		 * Clear/empty column(s) on the right side of geiven column.
		 */
		clearRightSide: function(current) {
			if (0===this.selection.length || current<0 || current>=this.columns.length) {
				return;
			}

			var i;

			for (i=this.selection.length-1; i>=0; i--) {
				if (this.selection[i].data().col > current) {
					this.selection.splice(i, 1);
				}
			}

			for (i=current+1; i<this.columns.length; i++) {
				this.columns[i].find('ul').empty();
				this.container.find('th:nth-child(' + (i+1) + ') .remove').css('visibility', 'hidden');
			}
		},



		/**
		 * Clear selection.
		 *
		 * @param col Column index to be cleared. Leave it blank to clear all the selection.
		 */
		clearSelection: function(col) {
			if (0 === this.selection.length) {
				return;
			}

			var i;

			if ('undefined' === typeof col) {
				for (i=this.selection.length-1; i>=0; i--) {
					this.selection[i].removeClass(this.options.checkedClass);
				}

				this.selection.length = 0;
			} else {
				for (i=this.selection.length-1; i>=0; i--) {
					if (this.selection[i].data().col === col) {
						this.selection[i].removeClass(this.options.checkedClass);
						this.selection.splice(i, 1);
					}
				}

				this.columns[col].data('selection', []);
			}
		},



		/**
		 *
		 * @param e
		 * @param checkIcon
		 * @returns {boolean}
		 */
		onCheck: function(e, checkIcon) {
			var i, $item = $(checkIcon).parents('.item');

			if ($item.hasClass(this.options.checkedClass)) {
				if (this.selection.length <= 1) {
					return false;
				}

				for (i=0; i<this.selection.length; i++) {
					if (this.selection[i].data().obj !== $item.data().obj) {
						$item.removeClass(this.options.activeClass);
						this.selection[i].addClass(this.options.activeClass);
						break;
					}
				}

				$item.removeClass(this.options.checkedClass);

				// Select the last item
				for (i=this.selection.length-1; i>=0; i--) {
					if ($item.data().obj === this.selection[i].data().obj) {
						this.selection.splice(i, 1);
						break;
					}
				}
			} else {
				$item.addClass(this.options.checkedClass);
				this.selection.push($item);
			}

			var col = $item.parents('.column').index();

			this.clearRightSide(col);
			this._setRemoveCount(col);

            this.options.onChecked.call(this, item, col, e);
			return false;
		},



		/**
		 * 
		 * @param e      Event
		 * @param item   Current item.
		 */
		onItemClicked: function(e, item) {
			var $item = $(item);

			if ($item.hasClass(this.options.activeClass) && this.selection.length===1) {
				return;
			}

			var col = $item.parents('.column').index();

			this.clearSelection(col);
			this.clearRightSide(col);

			$item.parent().find('li.active').removeClass(this.options.activeClass).end().end()
				 .addClass('checked active');

			this.selection.push($item);
			this._setRemoveCount(col);

			var data = $item.data().obj;

			if (this.options.createOnTheFly
				&& col === this.columns.length-1
				&& typeof data.expandable !== 'undefined'
				&& data.expandable)
			{
				this.addColumn('New level');
			}

			this.options.onItemClicked.call(this, item, col, e);
		},



		onCreateItem: function(e, item) {
			e.preventDefault();

			$.post($(this).attr('action'), $(this).serialize(), function(data){
				alert(data);
				$(this).reset();
			});
		}
	};


	// Plugin definition.
	$.fn.columnview = function(options) {

		var view = this,
			retval = this,
		   	args = Array.prototype.slice.call(arguments, 1);

		view.each(function(){
			var plugin = $(this).data('column-view');

			if (!plugin) {
				var opts = $.extend( {}, $.fn.columnview.defaults, options );

				$(this).data('column-view', new Plugin(this, opts));
			} else {
				if (typeof options === 'string' && typeof plugin[options] === 'function') {
					retval = plugin[options].apply(plugin, args);
				}
			}
		});

		return retval || view;
	};



	// Plugin defaults – added as a property on our plugin function.
	$.fn.columnview.defaults = {
		createOnTheFly: false,

		lang: {
			'btn-remove': 'Delete selected {0} item(s)',
			'btn-add': 'Add',
			'input-new-column-name': 'Name for new item',
			'new-column-caption': 'New Column'
		},

		// Callbacks
		onItemClicked: function(item, col, e) { return true; },
        onChecked: function(item, col, e) { return true; },
        onCreateItem: function(name, col, e) { return true; },
        onRemoveItem: function(col, e) { return true; },

		checkedClass: 'checked',
		tableClass: 'columns',
		activeClass: 'active'
	};

})(jQuery);
