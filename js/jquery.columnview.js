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
		this.compacted = this.container.hasClass('column-view-compact');
		this.itemMaps = [];

		this._init(options);
	}



	Plugin.prototype = {

		/*--------------------------------------------------------+
		|  Private Methods                                        |
		+--------------------------------------------------------*/

		_init: function(options) {
			this.options.url = options.url + '/';

			if (this.compacted) {
				this.container.append(
					'<div class="path"><ul></ul></div>'
				);
			}

			this.container
				.append('<div class="columns"><ul></ul></div>');

			var i, _this = this;

			if (options.columns.length) {
				for (i=0; i<options.columns.length; i++) {
					this.addColumn(options.columns[i]);
				}

				this.columns[0].addClass('active');
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


				this.container.children('.path').on('click', 'li', function(e){
				var index = $(this).index(),
				    $items = $(this).parent().children();

				_this.container.find('.active').removeClass('active');
				_this.columns[index].addClass('active');
				_this._clearRightSide(index);

				for (i=$(this).index(); i<$items.length; i++) {
				    $($items[i]).remove();
				}
			});
		},



		_setRemoveCount: function(col) {
			var i, selection = this.columns[col].data('selection');

			var $btn = this.columns[col].find('header .remove .caption')
						   .text(this.options.lang['btn-remove'].replace('{0}', ' ' + selection.length + ' '))
						   .parent();

			$btn.css('visibility', (selection.length <= 0 ? 'hidden' : 'visible'));
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
		 * Push item to the global selection and column local selection.
		 *
		 * @param $item jQuery     The element to push.
		 * @param col   integer    The index of column to hold the item.
		 */
		_pushSelection: function($item, col) {
			this.selection.push($item);

			var selection_in_col = this.columns[col].data('selection');

			selection_in_col.push($item);

			this.columns[col].data('selection', selection_in_col);
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
		 *
		 * @param $item
		 * @param col
		 * @returns {boolean}
		 * @private
		 */
		_appendSelection: function($item, col) {
			var i;

			if ($item.hasClass(this.options.checkedClass)) {
				// Uncheck the item

				if (this.selection.length <= 1) {
					return false;
				}

				// Traverse the selection and select an item that next to the current one
				for (i=0; i<this.selection.length; i++) {
					if (this.selection[i].data().obj !== $item.data().obj) {
						$item.removeClass(this.options.activeClass);
						this.selection[i].addClass(this.options.activeClass);
						break;
					}
				}

				$item.removeClass(this.options.checkedClass);

				// Remove current item from the selection
				for (i=this.selection.length-1; i>=0; i--) {
					if ($item.data().obj === this.selection[i].data().obj) {
						this.selection.splice(i, 1);
						break;
					}
				}

				var selection_in_col = this.columns[col].data('selection');

				for (i=selection_in_col.length-1; i>=0; i--) {
					if ($item.data().obj === selection_in_col[i].data().obj) {
						selection_in_col.splice(i, 1);
						break;
					}
				}

				this.columns[col].data('selection', selection_in_col);
			} else {
				// Check the item
				$item.addClass(this.options.checkedClass);
				this._pushSelection($item, col);
			}


			this._hideCreationForm(col+1);
			this._clearRightSide(col);
			this._setRemoveCount(col);
		},



		/*--------------------------------------------------------+
		|  Public Methods                                         |
		+--------------------------------------------------------*/


		/**
		 * Append a new column to the right most.
		 *
		 * @param caption String    Caption for the column.
		 */
		addColumn: function(caption) {
			var $column = $(
				'<li class="column"><header>'
				+ (this.compacted ? '<i class="fa fa-chevron-down"></i> ' : '')
				+ caption + '<span class="opt">'
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
			).data('selection', []);

			this.container.find('.columns > ul').append($column);
			this.columns.push($column);
		},



		/**
		 * Fill a specified column with data.
		 *
		 * @param col     The column to be filled.
		 * @param data    A array of item(s) to be filled, see appendItem for the format.
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
		 * @param col     The column to be filled.
		 * @param data    A array of item(s) to be filled, in following format:
		 *                [
		 *                    { id: '1',   title: 'Item 1', expandable: true },
		 *                    { id: '2',   title: 'Item 2', expandable: false },
		 *                    ...
		 *                    { id: 'N',   title: 'Item N', expandable: false }
		 *                ]
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

				this.itemMaps[data[i].id] = $item;

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
				return this.selection;
			}

			return this.columns[col].data('selection');
		},



		/**
		 * Clear the selection.
		 *
		 * @param col    Column index to be cleared. Leave it blank to clear all the selection.
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

				for (i=0; i<this.columns.length; i++) {
					this.columns[i].data('selection', []);
				}

				this._clearRightSide(0);
			} else {
				for (i=this.selection.length-1; i>=0; i--) {
					if (this.selection[i].data().col === col) {
						this.selection[i].removeClass(this.options.checkedClass);
						this.selection.splice(i, 1);
					}
				}

				this.columns[col].data('selection', []);
				this._clearRightSide(col);
			}
		},



		/**
		 * Remove selected item(s) in the given column.
		 *
		 * @param col    Column index to be cleared. Leave it blank to remove all the selections.
		 */
		removeSelection: function(col) {
			if (0 === this.selection.length) {
				return;
			}

			var i;

			if ('undefined' === typeof col) {
				for (i=this.selection.length-1; i>=0; i--) {
					this.selection[i].remove();
				}

				this.selection.length = 0;

				for (i=0; i<this.columns.length; i++) {
					this.columns[i].data('selection', []);
				}

				this._clearRightSide(0);
			} else {
				for (i=this.selection.length-1; i>=0; i--) {
					if (this.selection[i].data().col === col) {
						this.selection[i].remove();
						this.selection.splice(i, 1);
					}
				}

				this.columns[col].data('selection', []);
				this._setRemoveCount(col);

				if (col > 0 && 0 === this.columns[col].find('.item').length) {
					this.columns[col-1].find('.' + this.options.activeClass)
						.removeClass(this.options.expandableClass);
				}

				this._clearRightSide(col);
			}
		},



		/**
		 * Extend the selection by adding a given item.
		 *
		 * Notice: this method won't trigger any event.
		 *
		 * @param id
		 * @param col
		 */
		appendSelection: function(id, col) {
			if (!this.itemMaps.hasOwnProperty(id)) {
				return;
			}

			this._appendSelection(this.itemMaps[id], col);
		},



		/**
		 * Clear the current selection and select by given id(s).
		 *
		 * Notice: this method won't trigger any event.
		 *
		 * @param id	int|string|object|jQuery
		 * @param col   int
		 */
		setSelection: function(id, col) {
			var i;

			this.clearSelection(col);

			if ('object' === typeof id && !(id instanceof jQuery)) {

				for (i in id) {
					this.appendSelection(id[i], col);
				}

			} else {
				var $item;

				if ('number' === typeof id || 'string' === typeof id) {
					$item = this.itemMaps[id];
				} else {
					$item = id;
				}

				$item.parent().find('li.active').removeClass(this.options.activeClass).end().end()
			 				 .addClass('checked active');

				this._pushSelection($item, col);
				this._setRemoveCount(col);

				if (this.options.createOnTheFly
					&& col === this.columns.length-1
					)
				{
					this.addColumn('New level');
				}

				this._hideCreationForm(col+2);

				if (col+1 < this.columns.length) {
					this.columns[col+1].addClass('filled');
				}

				if (this.compacted &&  col+1 < this.columns.length) {
					this.columns[col+1].addClass('active');
					this.columns[col].removeClass('active');

					$('<li><i class="fa fa-chevron-right"></i> ' + $item.children('.caption').text() + '</li>')
						.appendTo(this.container.find('.path > ul'))
						.data('item', $item);
				}
			}
		},



		/*--------------------------------------------------------+
		|  Event handlers                                         |
		+--------------------------------------------------------*/


		/**
		 * Triggered when click on the checkbox of the item.
		 *
		 * @param e				Event object.
		 * @param checkIcon		Element that contains the checkbox.
		 * @returns {boolean}
		 */
		onCheck: function(e, checkIcon) {
			var $item = $(checkIcon).closest('.item'),
			col = $item.closest('.column').index();

			this._appendSelection($item, col);
			this.options.onChecked.call(this, $item, col, e);

			return false;
		},



		/**
		 * Trigered when click on an item.
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

			this.setSelection($item, col);

			this.options.onItemClicked.call(this, item, col, e);
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
		onChecked:     function(item, col, e) { return true; },
		onCreateItem:  function(name, col, e) { return true; },
		onRemoveItem:  function(col, e) { return true; },

		checkedClass:    'checked',
		tableClass:      'columns',
		activeClass:     'active',
		expandableClass: 'expandable'
	};

})(jQuery);

