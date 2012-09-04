var AppRouter = Backbone.Router.extend({
    
    routes: {
        "filter/:filter": "listFiltered",
        "": "listAll",
        "tag/:id/filter/:filter": "listByTagFiltered",
        "tag/:id": "listByTag",
        "page/:name": "showPage"
    },

    initialize: function() {

        // Bind animation for ajax operations
        $("#loading_block")
            .hide()
            .ajaxStart(function() {
                $(this).fadeIn();    
            })
            .ajaxStop(function() {
                var self = this;
                setTimeout(function(){
                    $(self).fadeOut();
                } , 1000);    
            });

        // Push csrf-token to every ajax request header (for django SessionAuthentication)
        $.ajaxSetup({
            global: true,
            beforeSend: function(jqXHR, settings) {
                // Pull the token out of the DOM.
                jqXHR.setRequestHeader('X-CSRFToken', $('input[name=csrfmiddlewaretoken]').val());
            }
        });

        // Instantiate collections 
        AppState.taskList = new TaskList();
        AppState.tagList = new TagList();

        // Instantiate views and pass collections to them
        this.appView = new AppView();
        this.taskListView = new TaskListView({ model: AppState.taskList }); 
        this.tagListView = new TagListView({ model: AppState.tagList });
        AppState.taskInputView = new MainInputView();

        // Get tags on initialization, because there no need to reload it on navigation
        AppState.tagList.fetch();

        this._init_filter_links();
        this._init_page_links();
    },

    listAll: function() {
        AppState.tag = '';
        AppState.filter = '';
        this._list();
    },

    listByTag: function(tag) {
        AppState.tag = tag;
        AppState.filter = '';
        this._list();
    },

    listFiltered: function(filter) {
        AppState.tag = '';
        AppState.filter = filter;
        this._list();
    },

    listByTagFiltered: function(tag,filter) {
        AppState.tag = tag;
        AppState.filter = filter;
        this._list();
    },

    showPage: function(name) {
        $('#page_'+name).show().siblings().hide();
        AppState.page = name;
        this._make_page_link_active();
    },

    _list: function() {
        AppState.page = 'home';
        $('#page_home').show().siblings().hide();

        this._make_page_link_active();
        this._rebuild_filter_links();

        // Bind 'make link tag active' callback to events: 1. When tag list rendered, 2. Tasks reset
        // 1 — fires, when tag list loaded first
        // 2 — fires, when task list reloads (history back/forward)
        this.tagListView.unbind(null,null,this);
        AppState.taskList.unbind(null,null,this);
        this.tagListView.bind('rendered',this._make_links_active,this);
        this.tagListView.bind('rendered',this._rebuild_tag_links,this);
        AppState.taskList.bind('reset',this._make_links_active,this);

        // Get tasks according to given tag
        AppState.taskList.fetch({'tag': AppState.tag, 'filter': AppState.filter });

    },

    _make_page_link_active: function() {
        $("#page_link_"+ AppState.page).addClass('active').siblings().removeClass('active');
    },

    _make_links_active: function() {
        $("#tag_item_"+AppState.tag).addClass('active').siblings().removeClass('active');
        $("#filter_"+ ( AppState.filter ? AppState.filter : 'all' )).addClass('active').siblings().removeClass('active');
    },

    _rebuild_filter_links: function() {
        $("#filters_list a").each(function(i,el) {
            var filter = $(el).parent().attr('id').split('_')[1];
            if (filter == 'all') {
                var href = AppState.tag ? '#tag/' + AppState.tag : '#';
            } else {
                var href = AppState.tag ? '#tag/' + AppState.tag + '/filter/' + filter : '#filter/' + filter;
            }
            $(el).attr('href',href);
        });
    },

    _rebuild_tag_links: function() {
        $("#tag_list li.tag_item").each(function(i,el) {
            var tag = $(el).attr('id').split('_')[2];
            if (tag == '') {
                var href = AppState.filter ? '#filter/' + AppState.filter : '#';
            } else {
                var href = AppState.filter ? '#tag/' + tag + '/filter/' + AppState.filter : '#tag/' + tag;
            }
            
            $('a',el).attr('href',href);
        });
    },

    _init_filter_links: function() {
        var self = this;
        $("#filters_list a").each(function(i,el){
            $(el).click(function(){
                $(this).parent().addClass('active').siblings().removeClass('active');
                AppState.filter = $(this).parent().attr('id').split('_')[1];
                self._rebuild_tag_links();
            });
        });
    },

    _init_page_links: function() {
        var self = this;
        $("#page_nav a").each(function(i,el){
            $(el).click(function(){
                $(this).parent().addClass('active').siblings().removeClass('active');
            });
        });
    }
});