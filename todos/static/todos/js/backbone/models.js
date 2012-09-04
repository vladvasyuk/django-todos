var Task = Backbone.Model.extend({
    urlRoot: API_TASK,
    defaults: {
    },
    toggle: function(eventObj) {
        this.save({
            completed: !this.get('completed'),
            date_completed: this.get('completed') ? null : Date.today().toString('yyyy-MM-dd')
        }, {
            success: function() {
                eventObj.trigger('success');
            }
        });
    }
});

var Tag = Backbone.Model.extend({
    urlRoot: API_TAG,
    defaults: {
    }
});

var TaskList = Backbone.Collection.extend({
    model: Task,

    initialize: function() {
        this.url = API_TASK;
        this.orig_url = this.url;
    },

    completed: function() {
        return this.where({ completed: true });
    },

    fetch: function(data) {
        
        data.filter = data.filter ? data.filter : 'all';
        data.tag = data.tag ? data.tag : '';
        
        switch (data.filter) {
            case 'all':
                var filterUrlPortion = '';
                break;
            case 'completed':
                var filterUrlPortion = 'completed=true';
                break;
            case 'active':
                var filterUrlPortion = 'completed=false';
                break;
            case 'overdued':
                var filterUrlPortion = 'deadline__lt='+Date.today().toString('yyyy-MM-dd');
                break;
        }

        
        var tagUrlPortion = data.tag ? 'tags__value='+data.tag : '';

        this.url = this.orig_url + '?' + [ tagUrlPortion , filterUrlPortion ].join('&');

        Backbone.Collection.prototype.fetch.call(this,data);
    },

    add: function(models) {
        Backbone.Collection.prototype.add.call(this,models);
    }

});

var TagList = Backbone.Collection.extend({
    model: Tag,
    url: API_TAG
});