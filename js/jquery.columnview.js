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
				.append('<ul class="columns"></ul>');

			var i, _this = this;

			for (i=0; i<options.columns.length; i++) {
				this.addColumn(options.columns[i]);
			}

			this.container.find('.columns')
				.on('click', 'header .remove', function(e){
					var col = $(this).closest('.column').index();

					if (! _this.options.onRemoveItem.call(_this, col, e)) {
						return true;
					}

					_this._hideCreationForm(col+1);
					_this._clearRightSide(col);
					_this._setRemoveCount(col);

					if (col > 0 && 0 === _this.columns[col].find('.item').length) {
						_this.columns[col-1].find('.' + _this.options.activeClass)
							.removeClass(_this.options.expandableClass);
					}

					return true;
				})
				.on('click', '.item', function(e){
					return _this.onItemClicked(e, this);
				})
				.on('click', '.item .checkicon', function(e){
					return _this.onCheck(e, this);
				})
				.on('submit', 'footer .form-add', function(e){
					e.preventDefault();

					var $name = $(this).find('.new-item-name');

					_this.options.onCreateItem.call(
						_this,
						$name.val(),
						$(this).closest('.column').index(),
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

			var $btn = this.columns[col].find('header .remove .caption')
						   .text(this.options.lang['btn-remove'].replace('{0}', ' ' + count + ' '))
						   .parent();

			$btn.css('visibility', (count <= 0 ? 'hidden' : 'visible'));
		},



		/**
		 * Toggle the form for item creation on/off.
		 */
		_hideCreationForm: function(start) {
			if (start >= this.columns.length) {
				return;
			}

			var i;

			// Hide the form for create item
			for (i=start; i<this.columns.length; i++) {
				this.columns[i].removeClass('filled');
			}
		},




		/**
		 * Append a new column to the right most.
		 *
		 * @param caption	string	Caption for the column.
		 */
		addColumn: function(caption) {
			var $column = $(
				'<li class="column"><header>' + caption + '<span class="opt">'
				+ '<a class="btn btn-xs remove"><i class="fa fa-remove"></i> <span class="caption">'
				+ this.options.lang['btn-remove'].replace('{0}', '')
				+ '</span></a></span></header>'
				+ '<ul class="items"></ul>'
				+ '<footer><form class="form-add"><input type="hidden" name="parent"/>'
				+ '<div class="col-xs-9"><input class="form-control new-item-name" placeholder="'
				+ this.options.lang['input-new-column-name'] + '" /></div>'
				+ '<div class="col-xs-3"><button class="btn btn-block"><i class="fa fa-plus"></i> '
				+ this.options.lang['btn-add'] + '</button></div>'
				+ '</form></footer></li>'
			);

			this.container.children('ul').append($column);
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

			this.columns[col].children('ul').empty();

			this.appendItem(col, data);
		},



		/**
		 * Append item to a given column.
		 *
		 * @param col		The column to be filled.
		 * @param data
		 */
		appendItem: function(col, data) {
			if (col >= this.columns.length) {
				return;
			}

			var src = this.columns[col].children('ul'),
				empty = (0 === src.children('.item').length);

			for (var i=0; i<data.length; i++) {
				var $item = $(
					'<li class="item'
					+ (data[i].expandable ? ' ' + this.options.expandableClass : '')
					+ '" data-id="' + data[i].id + '">'
					+ '<div class="caption">' + data[i].title + '</div>'
					+ '<div class="checkicon">'
					+ '<i class="fa fa-square-o"></i><i class="fa fa-check-square-o"></i>&nbsp;'
					+ '</div><i class="fa fa-chevron-right"></i></li>'
				);

				$item.appendTo(src).data({
					col: col,
					obj: data[i]
				});
			}

			this.columns[col].addClass('filled');

			if (data.length && empty && col-1 >= 0) {
				for (var i=0; i<this.selection.length; i++) {
					var data = this.selection[i].data();

					if (data.col == col-1) {
						this.selection[i].addClass(this.options.expandableClass);
					}
				}
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
		 * Clear/empty column(s) on the right side of the given column.
		 */
		_clearRightSide: function(current) {
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
				this.columns[i]
					.find('.items').empty()
					.prev().find('.remove').css('visibility', 'hidden');
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
			var i, $item = $(checkIcon).closest('.item');

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

			var col = $item.closest('.column').index();

			this._hideCreationForm(col+1);
			this._clearRightSide(col);
			this._setRemoveCount(col);

            this.options.onChecked.call(this, $item, col, e);
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

			var col = $item.closest('.column').index();

			this.clearSelection(col);
			this._clearRightSide(col);

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

			this._hideCreationForm(col+2);

			if (col+1 < this.columns.length) {
				this.columns[col+1].addClass('filled');
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

		checkedClass:    'checked',
		tableClass:      'columns',
		activeClass:     'active',
		expandableClass: 'expandable'
	};

})(jQuery);

