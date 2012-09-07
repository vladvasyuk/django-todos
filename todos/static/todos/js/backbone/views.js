// mix-in for views that may want to talk through #feedback
var Talker = Backbone.View.extend({
    display_errors: function(errors) {
        this.clear_errors();
        var self = this;
        this.$el.after(_.template($("#tpl_error_list").html()));
        _.each(errors, function(i,v) {
            _.each(i,function(e,f) {
                field = f;
                _.each(e,function(err) {
                    var errItem = _.template($("#tpl_error_item").html(), {
                                error: err,
                                field: '('+v+') '+field
                            });

                    $(".feedback_error",self.$el.parent()).append(errItem);
                })
            });
        },this);

    },

    clear_errors: function() {
        $(".feedback_error",this.$el.parent()).remove();
    },
});

var TaskListView = Backbone.View.extend({

    el: $("#task_list"),

    tagName: 'tbody',

    initialize: function() { 
        this.model.bind('reset',this.render,this);
        this.model.bind('remove',this.render,this);
    },

    render: function() {
        var self = this;
        this.$el.find('tbody').html('');

        if ( this.model.length == 0 ) {
        
            this.$el.find('tbody').append(_.template($('#tpl_task_list_none').html()));
        
        } else {
        
            this.model.each(function(item) {
                var itemView = new TaskItemView( { model: item } );
                self.$el.append(itemView.render().el);
            }); 
            
        }
    },

    addOne: function(m) {
        itemView = new TaskItemView( { model: m } );
        this.$el.prepend( itemView.render().el ); 
    }

});

var TagItemView = Backbone.View.extend({

    tagName: 'li',

    className: 'tag_item',

    template: _.template($('#tpl_tag_list_item').html()),

    events: {
        'click a': 'make_active',
        'click .close': 'destroy',
        'mouseenter': 'show_details',
        'mouseleave':  'hide_details'
    },

    initialize: function() {
        this.model.active = false;
        this.$el.attr('id','tag_item_'+this.model.get('value'));
    },

    render: function(tpl){
        tpl = tpl ? tpl : this.template;
        this.$el.html(tpl(this.model.toJSON()));
        return this;
    },

    make_active: function() {
        this.model.active = true;
        this.$el.siblings().removeClass('active');
        this.$el.addClass('active');
    },


    destroy: function() {
        var self = this;

        // Removed tag matches current list tag, go to home page
        if (self.model.get('value') == AppState.tag)
            AppState.Router.navigate('', {trigger: true});
        
        this.model.destroy({success: function() {
                AppState.tagList.remove(self.model);
                AppState.tagList.fetch();
                AppState.taskList.fetch({tag: AppState.tag, filter: AppState.filter});
            }
        });
    },

    show_details: function() {
        this.$('.close').fadeIn('fast');
    },

    hide_details: function() {
        this.$('.close').fadeOut('fast');
    },

});

var TagListView = Backbone.View.extend({

    el: $("#tag_list"),

    initialize: function() { 
        this.model.bind("reset",this.render,this);
        this.model.bind("change",this.render,this);
        this.model.bind("add",this.addOne,this);
    },

    render: function() {
        var self = this;
        this.$el.find('.tag_item').remove();
        
        // create All-tags link
        var allView = new TagItemView( {
            model: new Tag({ id: '', value: '' })
        });
        allView.$el.addClass('active');
        self.$el.append(allView.render(_.template($('#tpl_tag_list_all').html())).el);

        // create links for each tag in collection
        this.model.each(function(item) {
            var itemView = new TagItemView( { model: item } ); 
            self.$el.append( itemView.render().el );
        });

        // trigger for router
        this.trigger('rendered');
    },

    addOne: function(m) {
        itemView = new TagItemView( { model: m } );
        this.$('.'+itemView.className).first().after( itemView.render().el ); 
    }

});

var TaskInputView = Talker.extend({

    tagName: "div",

    className: "control-group",

    inputHistory: null,

    currentString: null,

    events: {
        'keypress .task_input': 'send',
        'keyup': 'history_move',
        'submit': 'do'
    },

    initialize: function() {
        _.bind(this.history_move,this);
        _.bind(this.send,this);

        this.inputHistory = [];
        this.currentString = 0;
    },

    render: function() {
        this.$el.html(this.options.template);
        return this;
    },

    history_move: function( e ) {
        if ( e.which != UP_KEY && e.which != DOWN_KEY ) return;
        if ( this.inputHistory.length == 0 ) return;

        var cur_index = this.currentString;
        var prev_index = cur_index - 1;
        var next_index = cur_index + 1;
        
        if ( e.which == UP_KEY && this.inputHistory[prev_index] ) {
            this.currentString = prev_index;
            this.$(".task_input").val(this.inputHistory[prev_index]);
        } else if ( e.which == DOWN_KEY && this.inputHistory[next_index] ) {
            this.currentString = next_index;
            this.$(".task_input").val(this.inputHistory[next_index]);
        }
    },

    /**
     * Task send cycle: (universal for add&update)
     * - parse task-string (extract #tags, date, !priority, ^deadline)
     * - send task info to server, then:
     * - if there tags present, check if they already on server, if not - create new ones
     * - attach created or existing tag ids to task by sending task model with this ids to server
     * - renew tag and task lists
     */
    send: function( e ) {
        // Trigger on ENTER press 
        if ( e.which != ENTER_KEY ) return;

        // don't allow send if there is commands in the buffer OR if empty field
        if ( $.trim(this.$(".task_input").val()) == "" ) {
            this.show_disabled();
            return;
        }

        this.clear_errors();

        var taskstring = $.trim(this.$(".task_input").val());
        var input = this.parseInput(taskstring);
        var self = this;
        var task = this.options.task ? this.options.task : new Task(); 
        var newTaskFlag = this.options.task ? false : true;

        this.inputHistory.push(taskstring);
        this.currentString = this.inputHistory.length;

        // callback for success event needed to bind tags to existing task
        task.save(input.task,{
            success: function(task,response) {
                if ( input.tags.length == 0 ) 
                    self.append_to_collections(task);
                else
                    self.process_tags(task,response,input.tags,newTaskFlag);
                // Clear input only if it no binded to specific task (editing)
                if(newTaskFlag)
                    self.$(".task_input").val('');
             },
             error: function(model,response) {
                self.display_errors($.parseJSON(response.responseText))
             }
        });
    
    },

    show_disabled: function() {
        this.$el.addClass("error");
        var self = this;
        setTimeout(function() { 
            self.$el.removeClass("error");
        }, 1000);
    },

    parseInput: function(str) {
        var tags = [];
        var priority;
        var title_words = [];
        var title;
        var deadline;
        var arr = str.split(' ');

        // Parse string according to standart taskstring syntax:
        // #word #another - tags
        // !number - priority
        // anydateformat - deadline
        for ( x in arr ) {
            if (arr[x][0] == '#') {
                tags.push(arr[x].substring(1));
            } else if (arr[x][0] == '!') {
                priority = arr[x].substring(1);
            } else if (arr[x][0] == '^') {
                var pDate = Date.parse(arr[x].substring(1));
                if (pDate) {
                    deadline = pDate.setTimezoneOffset('+0000').toString('yyyy-MM-dd');
                } else {
                    deadline = 'error';
                }
            } else {
                title_words.push(arr[x]);
            }
        }

        title = title_words.join(' ');

        return { 
            task: {
                title:      title,
                priority:   priority,
                deadline:   deadline,
                taskstring: str,
                tags:       []
            },
            tags: tags
        };
    },

    process_tags: function(task,response,tags,newTaskFlag) {
        // need to create tags and bind them to task
        // get existing tags id and bind them too
        var tags_count = tags.length;
        var newTags = [];
        var existingTags = [];
        var tags_created = 0;

        self = this;

        // callback for (created/or obtained from collection) tag insert
        var _push_tag = function(tag, currentError, globalError, newTagFlag){
            tags_created++;
            if ( !currentError ) {
                if(newTagFlag) {
                    newTags.push(tag);
                } else {
                    existingTags.push(tag);
                }
            }

            // if all tags bypassed, add them to task
            if ( tags_created == tags_count) {
                self.bind_tags(task,newTags,existingTags,globalError,newTaskFlag);
            }
        }
        var errorFlag = false;
        _.each(tags,function(tag){
            var existTag = AppState.tagList.where({ value: tag });
            
            // push tag to list from collection existing
            if (existTag.length > 0) { 

                _push_tag(existTag[0],false,false,false);

            // save tag to server and push to list
            } else {
                var newTag = new Tag({value: tag});
                
                newTag.save({},{
                    success: function(tag,response) {
                        _push_tag(tag,false,errorFlag,true);
                    },
                    error: function(model,response) {
                        errorFlag = true;
                        _push_tag(false,true,true,true);
                        self.display_errors($.parseJSON(response.responseText));
                    }
                });
            }
        }, this);
    },

    bind_tags: function(task, newTags, existingTags, errorFlag, newTaskFlag) {
            
        // If errors ocurred during tags creation:
        // Destroy task (if new)
        // Remove successfully created tags
        if (errorFlag) {
            if (newTaskFlag) 
                    task.destroy();
            _.each(newTags, function(tag) {
                tag.destroy();
            });
            return;
        }

        var tags = newTags.concat(existingTags);
        var self = this;
        
        task.save({ tags: tags }, { 
            success: function(newTask,response){
                self.append_to_collections();
            }
        });
    },

    append_to_collections: function() {
        // TODO: implement adding only altered task and tags
        $("#no_tasks").hide();
        AppState.taskList.fetch({'tag': AppState.tag, 'filter': AppState.filter })
        AppState.tagList.fetch();
   
    },

    do: function () { return false; }

});

var TaskItemView = Talker.extend({

    events: {
        'mouseenter': 'show_details',
        'mouseleave':  'hide_details',
        'dblclick':  'show_input',
        'blur .edit': 'hide_input',
        'click .close': 'destroy',
        'click .button_complete': 'toggle'
    },

    tagName: 'tr',

    className: 'task_item',

    template: $('#tpl_task_list_item').html(),

    render: function() {
        input = new TaskInputView({
            template: _.template($("#tpl_task_item_input").html(),this.model.toJSON()),
            task: this.model
        });
    
        this.$el.html(_.template(this.template,this.model.toJSON()));
        
        this.$('.view').append(input.render().el);

        return this;
    },

    show_details: function() {
        this.$('.close').fadeIn('fast');
        this.$('.task_details').fadeIn('fast');
    },

    hide_details: function() {
        this.$('.close').fadeOut('fast');
        this.$('.task_details').fadeOut('fast');
    },

    show_input: function() {
        this.$('.view').addClass('editing');
        this.$('input').focus();
    },

    hide_input: function() {
        this.$('.view').removeClass('editing');
        this.clear_errors();
    },

    destroy: function() {
        var self = this;
        this.model.destroy({success: function() {
                AppState.taskList.remove(self.model);
                AppState.tagList.fetch();
            }
        });
    },

    toggle: function() {
        
        // Create object to trigger success on it (when model saved) and refresh task list
        var trickyObj = {};
        _.extend(trickyObj,Backbone.Events);
        var self = this;

        trickyObj.bind('success',function() { 
            self.model.fetch({
                success: function() {
                    AppState.taskList.fetch({tag: AppState.tag, filter: AppState.filter});
                    AppState.tagList.fetch();
                }, 
                error: function() {
                    self.render();
                }
            });
        });

        this.model.toggle(trickyObj);
        self.render();
    }

});

var MainInputView = Backbone.View.extend({
    el: $("#main_input"),

    initialize: function() {
        this.render();
        this.$("#taskstring_help").popover({
            'content': $("#tpl_input_hint").html(),
            'title': 'Help on syntax'
        });
    },

    render: function() {
        var taskInputView = new TaskInputView({
            template: _.template($('#tpl_main_input_view').html()),
        });
        this.$el.append(taskInputView.render().el);
    }
});

var AppView = Backbone.View.extend({

    el: $('#id_todoapp'),

    events: {
        'click #clear_completed': 'clear_completed'
    },

    initialize: function() {
        AppState.taskList.bind('change',this.test_link,this);
        AppState.taskList.bind('remove',this.test_link,this);
        AppState.taskList.bind('reset',this.test_link,this);
    },

    clear_completed: function() {
        cmpl_count = AppState.taskList.completed().length;
        removed_count = 0;

        var _fetch_lists = function() {
            AppState.tagList.fetch();
            AppState.taskList.fetch({tag: AppState.tag, filter: AppState.filter});
        };

        _.each(AppState.taskList.completed(),function(item) {
            item.destroy({ 
                success: function() { 
                    removed_count++;
                    if ( removed_count == cmpl_count ) _fetch_lists();
                },
                error: function() {
                    removed_count++;
                    if ( removed_count == cmpl_count ) _fetch_lists();
                }
            });
        });
    },

    test_link: function() {
        if ( AppState.taskList.completed().length > 0 ) {
            $("#clear_completed").fadeIn('fast');
        } else {
            $("#clear_completed").fadeOut('fast');
        }
    }

});