/**
* @license
* Friend Labeller 1.0.0
* The MIT License (MIT)
*
* Copyright (c) 2016 pixeldepth.net - http://support.proboards.com/user/2671
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Labeller = function () {
	function Labeller() {
		_classCallCheck(this, Labeller);
	}

	_createClass(Labeller, null, [{
		key: "init",
		value: function init() {
			var _this = this;

			if (typeof yootil == "undefined") {
				return;
			}

			this.enums = {

				PLUGIN_ID: "pixeldepth_friend_labeller",
				PLUGIN_KEY: "pixeldepth_friend_labeller",
				PLUGIN_VERSION: "1.0.0",
				PLUGIN_CALLED: yootil.ts()

			};

			Object.freeze(this.enums);

			this.settings = {};
			this.images = {};

			this.setup();

			if (yootil.location.profile_friends()) {
				$(function () {
					if (yootil.page.member.id() == yootil.user.id()) {
						_this.create_labeller();
					}

					_this.label_friends();
				});
			}

			return this;
		}
	}, {
		key: "setup",
		value: function setup() {
			var plugin = pb.plugin.get(this.enums.PLUGIN_ID);

			if (plugin && plugin.settings) {
				var settings = plugin.settings;

				this.settings.labels = settings.labels || [];
				this.settings.micro_profile_height = parseFloat(settings.micro_profile_height);
				this.settings.labels_per_line = parseInt(settings.labels_per_line, 10) || 5;
				this.settings.dialog_height = parseInt(settings.dialog_height, 10) || 300;
				this.settings.dialog_width = parseInt(settings.dialog_width, 10) || 400;

				if (plugin.images) {
					this.images = plugin.images;
				}
			}
		}
	}, {
		key: "create_labeller",
		value: function create_labeller() {
			var $info = $(".micro-profile, .online-friends .mini-profile").find(".info");
			var $options_button = $("<div class='friend-labeller-button'><img title='Edit Label' alt='Edit Label' src='" + this.images.label + "' /></div>");

			$options_button.on("click", function () {
				Labeller.show_label_options(this);
			});

			$info.append($options_button);
		}
	}, {
		key: "show_label_options",
		value: function show_label_options(div) {
			var labels = Labeller.settings.labels;
			var $info = $(div).parent();
			var friend_url = $info.find(".user-link:first").attr("href");

			if (!friend_url) {
				friend_url = $info.parent().find(".user-link:first").attr("href");
			}

			var friend_id = 0;
			var user_id_match = friend_url.match(/\/user\/(\d+)\/?/i);

			if (!user_id_match || !parseInt(user_id_match[1], 10)) {
				console.warn("Friend Labeller: Could not match user link.");
				return;
			} else {
				friend_id = parseInt(user_id_match[1], 10);
			}

			pb.window.dialog("friend-labeller-dialog", {
				modal: true,
				height: this.settings.dialog_height,
				width: this.settings.dialog_width,
				title: "Select a Label",
				html: this.possible_labels(),
				resizable: true,
				draggable: true,
				dialogClass: "friend-labeller-dialog",

				open: function open() {
					var $dialog = $(this);
					var $btn = $("div.friend-labeller-dialog").find("button#btn-select-friend-label");
					var $items = $dialog.find("span.friend-labeller-dialog-item");

					$btn.css("opacity", 0.6);

					$items.click(function () {
						$items.css("opacity", 0.5).removeAttr("data-friend-label-selected");
						$(this).css("opacity", 1).attr("data-friend-label-selected", "selected");

						$btn.css("opacity", 1);
					});

					var already_labelled = $(div).find(".friend-labeller-labelled");

					if (already_labelled.length == 1) {
						var label_id = already_labelled.attr("data-friend-labeller-label");
						var $item = $items.find("[data-friend-label=" + parseInt(label_id, 10) + "]");

						if ($item.length == 1) {
							$item.css("opacity", 1);
						}
					}
				},

				buttons: [{

					text: "Close",
					click: function click() {
						$(this).dialog("close");
					}

				}, {

					id: "btn-select-friend-label",
					text: "Select Label",
					click: function click() {
						var $dialog = $(this);
						var $selected_item = $dialog.find("span.friend-labeller-dialog-item[data-friend-label-selected]");

						if ($selected_item.length == 1) {
							var id = parseInt($selected_item.attr("data-friend-label"), 10);

							Labeller.save(friend_id, id);
							Labeller.label_friend($info, friend_id, id, $selected_item.html());

							$dialog.dialog("close");
						}
					}

				}]

			});
		}
	}, {
		key: "save",
		value: function save(friend_id, label_id) {
			if (!friend_id) {
				return;
			}

			var current_data = yootil.key.value(Labeller.enums.PLUGIN_KEY, yootil.user.id()) || {};

			if (label_id == 0) {
				delete current_data[friend_id];
			} else {
				current_data[friend_id] = label_id;
			}

			yootil.key.set(Labeller.enums.PLUGIN_KEY, current_data, yootil.user.id());
		}
	}, {
		key: "label_friend",
		value: function label_friend(info) {
			var friend_id = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
			var label_id = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
			var label_text = arguments[3];

			if (!friend_id) {
				return;
			}

			var label = info.find(".friend-labeller-labelled");

			if (label_id == 0) {
				if (label.length) {
					label.remove();

					if (info.parent().hasClass("micro-profile")) {
						info.parent().css("height", "");
					}

					return;
				}
			}

			if (!label.length) {
				label = $("<div class='friend-labeller-labelled'></div>");
				info.append(label);
			}

			if (info.parent().hasClass("micro-profile")) {
				info.parent().css("height", Labeller.settings.micro_profile_height);
			}

			label.html(label_text);
		}
	}, {
		key: "possible_labels",
		value: function possible_labels() {
			var html = "";

			html += "<div class='friend-labeller-table'>";
			html += "<div class='friend-labeller-row'>";

			var counter = 0;

			for (var i = 0, l = this.settings.labels.length; i < l; i++) {
				var item = this.settings.labels[i];

				html += "<div class='friend-labeller-cell'>";
				html += "<span class='friend-labeller-dialog-item' data-friend-label='" + item.label_id + "'>";
				html += item.label_name;
				html += "</span>";
				html += "</div>";

				counter++;

				if (counter == this.settings.labels_per_line) {
					html += "</div><div class='friend-labeller-row'>";
					counter = 0;
				}
			}

			html += "</div>";
			html += "</div>";

			return html;
		}
	}, {
		key: "label_friends",
		value: function label_friends() {
			var $profile = $(".micro-profile, .online-friends .mini-profile");
			var $info = $profile.find(".info");
			var data = yootil.key.value(Labeller.enums.PLUGIN_KEY, yootil.page.member.id());

			if (!data) {
				return;
			}

			var has_label = false;

			$info.each(function () {
				var friend_url = $(this).find(".user-link:first").attr("href");

				if (!friend_url) {
					friend_url = $(this).parent().find(".user-link:first").attr("href");
				}

				var friend_id = 0;
				var user_id_match = friend_url.match(/\/user\/(\d+)\/?/i);

				if (!user_id_match || !parseInt(user_id_match[1], 10)) {
					console.warn("Friend Labeller: Could not match user link.");
					return;
				} else {
					friend_id = parseInt(user_id_match[1], 10);
				}

				if (data[friend_id]) {
					var label = Labeller.get_label(data[friend_id]);

					if (label) {
						$(this).append($("<div class='friend-labeller-labelled'>" + label + "</div>"));

						if ($(this).parent().hasClass("micro-profile")) {
							$(this).parent().css("height", Labeller.settings.micro_profile_height);
						}

						has_label = true;
					}
				};
			});
		}
	}, {
		key: "get_label",
		value: function get_label(id) {
			for (var i = 0; i < Labeller.settings.labels.length; i++) {
				if (Labeller.settings.labels[i].label_id == id) {
					return Labeller.settings.labels[i].label_name;
				}
			}
		}
	}]);

	return Labeller;
}();

;

Labeller.init();