/**
 * Created by Administrator on 2015/7/29.
 */
$(function(){
    var music={
        init:function(){
            this.render();
        },
        render:function(){
            this.event();
        },
        event:function(){
            var musicList=$('.music-list');
            musicList.on('click','.music-item',function(){
                var _this=$(this),
                    _siblings=_this.siblings();
                _this.addClass('active');
                _siblings.removeClass('active');
            })

        },
        _canvasDisplay:function(){

        },
        audioPAI:function(){

        },
        _ajaxHandler:function(id){
            var defer= $.Deferred();
            $.ajax({
                url:'/'+id,
                dataType:'arraybuffer',
                type:'get',
                success:function(data){
                    defer.resolve(data);
                },
                error:function(err){
                    defer.reject(err);
                }
            });
            return defer.promise();
        }
    }
    music.init();
})