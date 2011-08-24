var current_book=0;
var current_page,next_page,previous_page;
var page_width=0;
var new_page=0;

$(document).ready(function(){
	
	page_width=$('body').width();

	page_height=document.body.clientHeight;
	
	
	if(navigator.userAgent.match(/iPhone/i))
	{
		if(window.navigator.standalone==true)
		{
			page_height=460
		}
		else
		{
			page_height=416;			
		}
		$('body').css('min-height',page_height+"px");
	}
	$('#bar').css('min-height',page_height+"px");


	//media queries don't work everyhwhere to detect orientation
	var old_orientation=-1;
	setInterval(function (){
		if(old_orientation!=window.orientation)
		{old_orientation=window.orientation;
			if(window.orientation==90 || window.orientation==-90){window.scrollTo(0, 1);$('#rotate').show();}
			else{$('#rotate').hide();window.scrollTo(0,1);}}
			},300);
	
	var next_panel_delay=0;
	if(typeof(window.navigator.standalone)!='undefined' && window.navigator.standalone==false && localStorage.getItem("splash")==null)
	{
		localStorage.setItem("splash",true);
		show_panel('#splash');
		next_panel_delay=1000;			
	}
	else
	{
		show_panel('#splash');
		next_panel_delay=500;
	}	
		
	
	$('#loading').bind('touchstart click',function(e){e.preventDefault();})
	$('#deck').bind('click',click).bind('touchstart',touchstart).bind('touchmove',touchmove).bind('touchend',touchend);		
	$('#home').bind('touchstart click',function(e){show_library();e.preventDefault();});
	$('#hide_bar').bind('touchstart click',function(e){show_book_navigation_bar(false);e.preventDefault();})
	$('#line').bind('touchstart click',function(e){show_book_navigation_bar(true);e.preventDefault();});
	$('.menu_button').bind("click  touchstart",function(e){select_menu_item($(this).parent().parent(),$(this))});
	
    draw_logo($('#logo')[0].getContext("2d"));
    draw_rotate($('#rotate canvas')[0].getContext("2d"));	

	book_storage.init_storage(
		function() {
			
			
			//init storage with list of books
			for (var id in conf.book_list) { book_storage.add_book(id,conf.book_list[id],function(){console.log('book added')},handle_fatal_error); }
			//has the user already started a book
			book_storage.get_current_book(
				function(book){
					if(book!=null)
					{		
						//setTimeout(show_library,next_panel_delay);
						
						//setTimeout(show_library,next_panel_delay);	
						setTimeout(function(){display_book(book);},next_panel_delay);
					}
					else
					{
						setTimeout(show_library,next_panel_delay);								
					}
				},
			handle_fatal_error
			);										
		},
		handle_fatal_error);
	});
	
	//*****************************************
	//Iniate system to display the given book
	//*****************************************	
	function display_book(book)
	{	
		document.getElementById('deck').innerHTML="<div id='prev' class='page'></div><div id='current' class='page'></div><div id='next' class='page'></div>";

		//global static element references for performance
		current_page=document.getElementById('current');
		next_page=document.getElementById('next');
		previous_page=document.getElementById('prev');

		current_page.addEventListener( 'webkitTransitionEnd', function(){set_content(new_page);}, false );
		
		current_book=book;		
		current_book.pages_length=current_book.content.length;		
		var styles=current_book.page_css.split(';');
		
		// //give more top spacing in standalone mode
		// if(window.navigator.standalone!='undefined' && window.navigator.standalone==true);
		// {
		// 	styles.push('padding-top:5px !important');
		// }
				
		for(var member in styles)
		{
			style=styles[member].split(":");
			current_page.style[style[0]]=style[1];
			previous_page.style[style[0]]=style[1];
			next_page.style[style[0]]=style[1];
		}	
		goto_page(book.current_page,true);
		show_panel('#deck');	
	}
	//*****************************************
	//Show hide the nav bar when reading a book
	//*****************************************
	function show_book_navigation_bar(show)
	{
		if(show)
		{
			$('#line').addClass('in_bar');
			
			$('#locations').html('');
			$('#bar .title').html(current_book.title);			
			$('#bar .authors').html(current_book.authors.join(","));			
			$('#locations').append("<li page='0'>Cover</li>");
			for(var chapter in current_book.chapters)
			{
				$('#locations').append("<li page='"+current_book.chapters[chapter][0]+"'>"+current_book.chapters[chapter][1]+"</li>");
			}
			$('#locations').append("<li page='"+(current_book.pages_length-1)+"'>Last Page</li>");
			
			$('#locations li').click(function(){goto_page(parseInt($(this).attr('page')),true);$('#locations').html('');});

			
			
			$('#more_options').html("");
			$('#more_options').attr('book_id',current_book.id);
			$('#more_options').append("<li><div class='button remove' style='margin-right:5px;'>Remove Book</div></li>");
			
			if(conf.book_list[current_book.id].purchase_links && conf.book_list[current_book.id].purchase_links.amazon)
			{
				$('#more_options').append("<li ><div class='button amazon' url='"+conf.book_list[current_book.id].purchase_links.amazon+"' style='margin-right:5px;'>Buy on Amazon</div></li>");
			}
			
			$('#more_options').append("<li ><div class='button tweet' style='margin-right:5px;'>Tweet Book</div></li>");
			$('#more_options').append("<li ><div class='button email' style='margin-right:5px;'>Email Book</div></li>");
			
			
			

			$('[url]').bind('click',
				function(e){e.preventDefault();e.stopPropagation();window.location=$(this).attr('url');}
						);
			$('[book_id] .remove').bind('click',
				function(e){
					stop_event(e);					
					book_storage.remove_book( $(this).parents('[book_id]').attr('book_id'),show_library);
					});	
			$('[book_id] .tweet').bind('click',
				function(e){
					stop_event(e);					
					tweet_book_check($(this).parents('[book_id]').attr('book_id'));
					});						

			$('li.[book_id]').bind('click',
				function(e){
					stop_event(e);
					get_book($(this).attr('book_id'),handle_fatal_error);					
					});
					
			$('#bar').css('z-index',200);
			$('#bar').show();			
			select_menu_item($('#bar > .menu'),$('#bar [target="locations"]'));	
			$('#bar').css('height',($('#locations').height()+130)+"px !important");			

		}
		else
		{
			window.scrollTo(0,1);
			$('#line').removeClass('in_bar');
			$('#bar').css('z-index',-200);	
			$('#bar').css('height',0);			
			$('#bar').hide();
			$('#locations').html('');
		}
	}
	
	function select_menu_item(menu,item)
	{		
		setTimeout(function(){window.scrollTo(0,0);	},10);
		var previous=menu.children('.menu_buttons').children('.selected').removeClass('selected');		
		$(item[0]).addClass('selected');
		var item_index=menu.children('.menu_buttons').children('.menu_button').index(item);
		
		$('#'+item.attr('target')).show();	
		if(item.attr('target')!=previous.attr('target'))
		{
			setTimeout(function(){$('#'+previous.attr('target')).hide();},200);
	
		}		
		
		menu.children('.menu_panels').children('.menu_panel').css('-webkit-transform','translateX('+(item_index)*page_width+'px)');


	}	

	
	function stop_event(e)
	{
		e.preventDefault();
		e.stopPropagation();
	}
	function tweet_book_check(id)
	{
		$.getJSON('php/check.php', function(data) {
		if(data.status=='success')
		{
			tweet_book(id)
		}
		else
		{
			if(confirm("Go to twitter to connect your twitter account?"))
			{
				window.location='php/connect.php';
			}
		}
		
		})
	}
	function tweet_book(id)
	{	
		book_storage.get_book(id,function(book){		
			if(confirm("Tell your followers that you read "+book.title+"?"))
			{		
				var message=escape("I am reading '"+book.title+"' on http://hyper-books.com");
				$.getJSON('php/post.php', function(data) {

					if(data.status=='success')
					{
						alert("Twweet sent!");
					}
				}
				)
			}
		}
		)
	}

	//*****************************************
	//Shows the Library of Books Panel
	//*****************************************	
	function show_library()
	{		
		function create_interface()
		{
			if(list_amount==3)
			{
				$('[book_id] .details').bind('click',
					function(e)
					{
						stop_event(e);
						var id=$(this).parent('[book_id]').attr('book_id');			
						if(!$('#detail_panel_'+id).is(":visible"))
						{
							$('.detail_panel').hide();
							$('#all_books ul .details').css('-webkit-transform',' rotate(0deg)');										
							$('#detail_panel_'+id).show(200);
							$('#all_books li[book_id="'+id+'"] .details').css('-webkit-transform',' rotate(90deg)');				
						}
						else
						{
							$('.detail_panel').hide(200);
							$('#all_books ul .details').css('-webkit-transform',' rotate(0deg)');						
						}
					}
				);	
				$('[url]').bind('click',
					function(e){e.preventDefault();e.stopPropagation();window.location=$(this).attr('url');}
							);
				$('[book_id] .remove').bind('click',
					function(e){
						stop_event(e);					
						book_storage.remove_book( $(this).parents('[book_id]').attr('book_id'),show_library);
					
						});	
				$('[book_id] .tweet').bind('click',
					function(e){
						stop_event(e);					
						tweet_book_check($(this).parents('[book_id]').attr('book_id'));
						});						

				$('li.[book_id]').bind('click',
					function(e){
						stop_event(e);
						get_book($(this).attr('book_id'),handle_fatal_error);					
						});		
				select_menu_item($('#available_for_download .menu'),$('#all_books [target="available_for_download_en"]'));						
				show_panel('#all_books');
				select_menu_item($('#all_books > .menu'),$('#all_books [target="my_books"]'));

						
				
			}			
		}
		
		function render_list(list,if_empty_text)
		{
			list_amount++;
			if(list.length==0)
			{
				return if_empty_text;
			}
			var all=""
			for(var i=0;i<list.length;i++) 
			{
				var book=list[i];
				var li='<li book_id="'+book.id+'">';
				if(book.is_ready==1)
				{
					li+="<div class='state details' style='opacity:0.1'>&gt;</div><div class='title' >"+book.title+"</div><div class='authors'>"+book.authors+"</div>";
					li+="<div id='detail_panel_"+book.id+"' class='detail_panel'>";
					li+="<div class='button remove' style='margin-right:12px;'>Remove</div>";
					if(book.purchase_links && book.purchase_links.amazon)
					{
						li+="<div class='button amazon' url='"+book.purchase_links.amazon+"'>Buy on Amazon</div>";
					}
					li+="<div class='button tweet'>Tweet</div><div class='button email'>Email</div></div></li>";		
				}
				else
				{
					li+="<div class='title' >"+book.title+"</div><div class='authors'>"+book.authors+"</div>";			
				}
				
				all+=li+"</li>";
			}	
			return all;		
		}
			
		var list_amount=0;
			
		book_storage.get_all_books(1,'',
			function(list)
			{				
				$('#my_books').html(render_list(list,"<div class='intro'><p><b>Hyper Books</b> is a mobile browser based e-book reader. The featured books are copyright free classics from digital libraries such as Project Gutenberg in Australia, Germany and the United States.</p><p>All downloaded books are stored on your phone and available offline. Please bookmark this site so you can enjoy your books when you are off the grid. </p></div>"));
						
				create_interface();
			});

		book_storage.get_all_books(0,'de',
			function(list)
			{
				$('#available_for_download_de').html(render_list(list),"<li><blockquote><i>All verfuegbaren buecher sind bereits runtergeladen.</i></blockquote></li>");												
				create_interface();
			});
		book_storage.get_all_books(0,'en',
			function(list)
			{
				$('#available_for_download_en').html(render_list(list),"<li><blockquote><i>All books are already downloaded.</i></blockquote></li>");												
				create_interface();
			});									
    }
	
	//*****************************************
	//Get the book with the given ID, if the 
	//is not already existing it will loaded
	//*****************************************	
	function get_book(id)
	{
		book_storage.get_book(id,
			function(book){
				if(book.is_ready)
				{
					display_book(book);
				}
				else
				{
					load_book(book);
				}							
			});
	}
	

	function load_book(book)
	{
		document.getElementById('deck').innerHTML="<div id='prev' class='page'></div><div id='current' class='page'><div class='chapter_title' id='chapter_title_test'>test</div></div><div id='next' class='page'></div>";		
		$('.phantom').remove();  
		$('body').append("<div class='phantom' id='phantom_"+book.id+"' ><div class='page '><div></div></div></div>");
		var phantom_page=$('#phantom_'+book.id+' .page *')[0];
		
		var styles=book.page_css.split(';');
		for(var member in styles)
		{
			style=styles[member].split(":");
			phantom_page.style[style[0]]=style[1];
		}
		
		var styles=['font-size','line-height','width','height','font-family','border-top-width','border-bottom-width','border-bottom-width','border-right-width','padding-top','padding-right','padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left'];

		var page_css_string="";
		for(var style in styles)
		{
			if(window.getComputedStyle(document.getElementById('current'),null)[styles[style]]!="" && window.getComputedStyle(document.getElementById('current'),null)[styles[style]]!="auto")
			{
				page_css_string+=styles[style]+":"+window.getComputedStyle(document.getElementById('current'),null)[styles[style]]+";";
			}
			
		}
		
		
		
		var chapter_css_string="";
		for(var style in styles)
		{
			if(window.getComputedStyle(document.getElementById('chapter_title_test'),null)[styles[style]]!="" && window.getComputedStyle(document.getElementById('chapter_title_test'),null)[styles[style]]!="auto") 
			{
				chapter_css_string+=styles[style]+":"+window.getComputedStyle(document.getElementById('chapter_title_test'),null)[styles[style]]+";";
			}
			
		}


		if(book.cover_markup)
		{
			$('#loading .cover').html(book.cover_markup);
		}
		else
		{
			
			$('#loading .cover').html('<h1 class="title"></h1>by<h3 class="authors"></h3><br/>');
			if(book.title.length>50)
			{
				$('#loading .title').css('font-size','130%').html(book.title);	
			}
			else
			{
				$('#loading .title').html(book.title);	
			}
		}
		$('#loading .authors').html(book.authors.join('<br/>'));			

		$('#cover_message').html("Downloading book ...");		
		
		show_panel('#loading');
		
		$.get("data/"+book.id+".txt",function(data){
			$('#cover_message').html('Formatting book ...');
			
			if(data.match(/(^|\n)(APPENDIX\.?|INTRODUCTION\.?|INTRO\.?|PREFACE\.?)(\n)/ig))
			{
				data=data.replace(/(^|\n)(APPENDIX\.?|INTRODUCTION\.?|INTRO\.?|PREFACE\.?)(\n)/ig,"<div class='chapter_title'>$2</div>$3");				
			}
			
			if(data.match(/(^|\n)(PART.+CHAPTER.+|CHAPTER.+)(\n)/ig))
			{
				data=data.replace(/(^|\n)(PART.+CHAPTER.+|CHAPTER.+)(\n)/ig,"<div class='chapter_title'>$2</div>$3");				
			}
			else if(data.match(/(^|\n\n)(\d+\.?)(\n)/ig))
			{
				data=data.replace(/(^|\n\n)(\d+\.?)(\n)/ig,"<div class='chapter_title'>$2</div>$3");
			}
			else if(data.match(/(^|\n\n)([IVX]+\..+)(\n)/mg))
			{
				data=data.replace(/(^|\n\n)([IVX]+\..+)(\n)/mg,"<div class='chapter_title'>$2</div>$3");
			}
	
			else if(data.match(/(^|\n\n)([IVX]+)(\s*\n)/mg))
			{
				data=data.replace(/(^|\n\n)([IVX]+)(\s*\n)/mg,"<div class='chapter_title'>$2</div>$3");
			}
			else
			{
				data=data.replace(/(^|\n)([A-Z][A-Z 0-9\.\?\!\'\"\:\-]+)(\n)/g,"<div class='chapter_title'>$2</div>$3");
			}
			
			data=data.replace(/\n\n\n?/g,' <br><br>')
			
			$.post("php/get_book.php", {"book_id": book.id,"page_css": page_css_string, "chapter_css": chapter_css_string }, function(book_data) {
			
			  							
			  var _book=jQuery.parseJSON(book_data);
			  console.log(_book);
			  //do we have the layout of the book already
			  if(_book.pages_array)
			  {		
				var pages_array=_book.pages_array.split(',');		
				pages_array.shift();
				book.chapters=new Array();
				book.content=new Array("<div class='cover'>"+$('.cover').html()+"</div>");
				book.chapters=jQuery.parseJSON(_book.chapter_json.replace(/,\\"/g,',"').replace(/\\"\]/g,'"]'));
				for(page in pages_array)
				{
					var space=data.match(/^(<br>)+/);
					if(space)
					{
						data=data.substring(space[0].length);
					}
					book.content[book.content.length]=data.substring(0,pages_array[page]);
					data=data.substring(pages_array[page]);
				}
				display_book(book);
				ready_to_read=true;				
				book.is_ready=1;			
				current_book.current_page=0;				
				book_storage.book_update_content(book,
					function(){},
					handle_fatal_error														
					);
			  }
			  else
			  {
			//normalize data

				var time_start=new Date().getTime();

				function success_callback(book)
				{
					console.log(new Date().getTime()-time_start);
					$('#cover_message').html('Done, enjoy the book!');	
					display_book(book);
					ready_to_read=true;				
					book.is_ready=1;			
					current_book.current_page=0;				
					book_storage.book_update_content(book,
						function(){},
						handle_fatal_error														
						);	
					pages_array="";
					for(var page in book.content)
					{
						pages_array+=book.content[page].length+",";	
					}

					$.post("php/add_book.php", { "book_id": book.id, "page_css": page_css_string, "chapter_css": chapter_css_string, "pages_array":pages_array, "chapter_json":JSON.stringify(book.chapters) } );
							
				}
				var ready_to_read=false;
		
			
				function progress_callback(progress)
				{
					$('#progress').html(progress);
				}						

				var max_height=$('#deck > *').height();
				book.chapters=new Array();
				book.content=new Array("<div class='cover'>"+$('.cover').html()+"</div>");
			
			
				
				
				$('#cover_message').html('Formatting book ... <span id="progress">0</span>%<br/><small><br/>Only done once per book, thanks for your patience!<br/></small>');						
			
				var settings={
					'book':book,
					'content':data,
					'phantom_page':phantom_page,
					'max_height':max_height,
					'treshold':30,
					'amount_of_words_per_load_initial':500,
					'amount_of_words_per_load':500,
					'processing_chunk_size':1000,
					'success_callback':success_callback,
					'book_ready_to_read':null,
					'progress_callback':progress_callback
				}
			
				prepare_book(settings);
		}})});
	
	}
	
	
	function show_panel(id,time)
	{
		$('body').css('height',page_height);
		$('#deck').css('height',page_height);						
		show_book_navigation_bar(false);
		setTimeout(function(){window.scroll(0,1)},100);
		if(!$(id).is(":visible"))
		{
			$(".panel").hide();
			$(id).show(time);
			if(id=='#deck')
			{

				$('#home,#line').show();
			}
			else
			{
				$('#home,#line').hide();			
			}		
		}	

	}
	function goto_page(new_page,direct,time)
	{
		
		show_book_navigation_bar(false);

		if(time==null)
		{
			time='0.5s';
		}
		if(new_page>=0 && new_page<=current_book.pages_length)
		{
			if( direct )
			{	
				set_content(new_page);		
				if(new_page>0)
				{
					$('body').append("<div id='current_book' class='width' style='display:block'>"+current_book.title+"<div class='progress'>"+Math.ceil(new_page*100/current_book.pages_length)+"% into the Book</div></div>");
					$('#current_book').delay(1500).animate({'opacity':0},500,function(){$('#current_book').remove()});
				}
			}
			else
			{
				window.new_page=new_page;
				if(current_book.current_page<current_book.pages_length && new_page>current_book.current_page)
				{
					current_page.style['-webkit-transition-duration']=time;
					next_page.style['-webkit-transition-duration']=time;					
					current_page.style.webkitTransform='translate(-'+page_width+'px,0px)';
					next_page.style.webkitTransform='translate(0px,0px)';										
				}
				if(current_book.current_page!=0 && new_page<current_book.current_page)
				{
					current_page.style['-webkit-transition-duration']=time;
					previous_page.style['-webkit-transition-duration']=time;					
					current_page.style.webkitTransform='translate('+page_width+'px,0px)';
					previous_page.style.webkitTransform='translate(0px,0px)';
				}					
			}	
			current_book.current_page=new_page;			
			book_storage.update_current_page(current_book.id,new_page);
		}

	}		
	function set_content(page)
	{
		current_page.style['-webkit-transition-duration']='0s';
		previous_page.style['-webkit-transition-duration']='0s';
		next_page.style['-webkit-transition-duration']='0s';				

		current_page.style.webkitTransform='translate(0px,0px)';
		next_page.style.webkitTransform='translate('+page_width+'px,0px)';		
		previous_page.style.webkitTransform='translate(-'+page_width+'px,0px)';		
		

				
		document.getElementById('line').innerHTML="<div class='line' ><div style='width:"+(page*100/(current_book.pages_length-1)).toFixed(1)+"%' class='left'></div></div>";	

		current_page.innerHTML=current_book.content[page];
		if(page>0)
		{
			previous_page.innerHTML=current_book.content[page-1];			
		}
		if(page<(current_book.pages_length-1))
		{
			next_page.innerHTML=current_book.content[page+1];					
		}
		else
		{
			next_page.innerHTML="";					

		}		
	}


	//event handling
	var first_x,first_y,delta_x,consumed,fingers,show_book_navigation_bar_interval_id;
	function click(e)
	{

		clearInterval(show_book_navigation_bar_interval_id);
		duration=new Date().getTime();
		$('#current_book').remove();
		touch_time=new Date().getUTCMilliseconds();
		if(e.clientY<20)
		{
				show_book_navigation_bar(true);
		}
		else if($('#bar').css('display')=='block')
		{
			show_book_navigation_bar(false);
		}		
		else if(e.clientX>page_width/2)
		{	
			goto_page(current_book.current_page+1);
		}
		else
		{	
			goto_page(current_book.current_page-1);	
		}


	}
	function touchstart(e)
	{

		if(document.getElementById('current_book'))
		{
			$('#current_book').remove();
		}
		if(show_book_navigation_bar_interval_id!=null)
		{
			clearInterval(show_book_navigation_bar_interval_id);
			show_book_navigation_bar_interval_id=null;
		}
		fingers=event.touches.length;
		event.preventDefault();

		if(fingers == 2)
		{
				goto_page(0,true);
		}
		else if(fingers == 3)
		{
				show_library();
		}	
		else if(fingers == 1)
		{
			first_x = event.touches[0].pageX;
			first_y = event.touches[0].pageY;	
			delta_x=0;
			consumed=false;
			show_book_navigation_bar_interval_id=setInterval(function(){consumed=true;show_book_navigation_bar(true);clearInterval(show_book_navigation_bar_interval_id);},750);		
		}
	}
	function touchmove(e)
	{
		if(show_book_navigation_bar_interval_id!=null)
		{
			clearInterval(show_book_navigation_bar_interval_id);
			show_book_navigation_bar_interval_id=null;
		}	
		delta_x=event.touches[0].pageX-first_x;
		if( ((delta_x <0 && current_book.current_page != (current_book.pages_length-1))) || (delta_x >0 && current_book.current_page!=0) && fingers==1)
		{			
			current_page.style.webkitTransform='translate('+delta_x+'px,0px)';			
			if(delta_x < 0)
			{
				next_page.style.webkitTransform='translate('+(page_width+delta_x)+'px,0px)';
			}
			else
			{
				previous_page.style.webkitTransform='translate('+(-page_width+delta_x)+'px,0px)';
			}					
		}
		
	}
	function touchend(e)
	{
		clearInterval(show_book_navigation_bar_interval_id);
		if(!consumed && fingers==1)
		{			
			if(delta_x>0 && current_book.current_page!=0 )
			{
				goto_page(current_book.current_page-1,false,'0.1s');
			}
			else if(delta_x < 0 && current_book.current_page != (current_book.pages_length-1))
			{
				goto_page(current_book.current_page+1,false,'0.1s');
			}
			else if(delta_x==0 && fingers == 1)
			{
				if(first_y<20)
				{
						show_book_navigation_bar(true);
				}
				else if($('#bar').css('display')=='block')
				{
						show_book_navigation_bar(false);
				}
				else if(first_x>page_width/2)
				{
					goto_page(current_book.current_page+1,false,'0.1s');
				}
				else
				{
					goto_page(current_book.current_page-1,false,'0.1s');
				}
			}

		}

		
	}				





function handle_fatal_error(error)
{
	console.log(error);
	alert(error);
}

function draw_logo(ctx) {

  // layer1/Path
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(46.8, 29.3);
  ctx.bezierCurveTo(54.8, 29.3, 61.3, 22.7, 61.3, 14.6);
  ctx.bezierCurveTo(61.3, 6.5, 54.8, 0.0, 46.8, 0.0);
  ctx.bezierCurveTo(38.8, 0.0, 32.4, 6.5, 32.4, 14.6);
  ctx.bezierCurveTo(32.4, 22.7, 38.8, 29.3, 46.8, 29.3);
  ctx.closePath();
  ctx.fillStyle = "#cdcdcd";
  ctx.fill();

  // layer1/Compound Path
  ctx.beginPath();

  // layer1/Compound Path/Path
  ctx.moveTo(60.9, 30.8);
  ctx.bezierCurveTo(67.5, 31.0, 70.3, 36.4, 70.3, 36.4);
  ctx.lineTo(91.6, 66.0);
  ctx.bezierCurveTo(92.5, 67.3, 93.0, 68.9, 93.0, 70.7);
  ctx.bezierCurveTo(93.0, 75.3, 89.3, 79.0, 84.8, 79.0);
  ctx.bezierCurveTo(83.7, 79.0, 82.7, 78.8, 81.8, 78.4);
  ctx.lineTo(68.9, 74.8);
  ctx.lineTo(68.9, 87.8);
  ctx.lineTo(24.2, 87.8);
  ctx.lineTo(24.2, 74.8);
  ctx.lineTo(11.3, 78.4);
  ctx.bezierCurveTo(10.4, 78.8, 9.3, 79.0, 8.2, 79.0);
  ctx.bezierCurveTo(3.7, 79.0, 0.0, 75.3, 0.0, 70.7);
  ctx.bezierCurveTo(0.0, 68.9, 0.5, 67.3, 1.4, 66.0);
  ctx.lineTo(22.8, 36.4);
  ctx.bezierCurveTo(22.8, 36.4, 25.6, 31.0, 32.1, 30.8);
  ctx.lineTo(60.9, 30.8);
  ctx.lineTo(60.9, 30.8);
  ctx.closePath();

  // layer1/Compound Path/Path
  ctx.moveTo(46.5, 78.7);
  ctx.lineTo(46.5, 78.7);
  ctx.lineTo(63.2, 73.1);
  ctx.lineTo(62.8, 73.0);
  ctx.bezierCurveTo(51.3, 69.6, 55.8, 54.2, 67.3, 57.6);
  ctx.lineTo(68.9, 58.2);
  ctx.lineTo(68.9, 40.8);
  ctx.lineTo(46.5, 48.2);
  ctx.lineTo(24.2, 40.8);
  ctx.lineTo(24.2, 58.2);
  ctx.lineTo(25.7, 57.6);
  ctx.bezierCurveTo(37.2, 54.2, 41.7, 69.6, 30.2, 73.0);
  ctx.lineTo(29.8, 73.1);
  ctx.lineTo(46.5, 78.7);
  ctx.lineTo(46.5, 78.7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function draw_rotate(ctx)
{

      // layer1/Group
      ctx.save();

      // layer1/Group/Compound Path
      ctx.save();
      ctx.beginPath();

      // layer1/Group/Compound Path/Path
      ctx.moveTo(0.0, 27.7);
      ctx.lineTo(0.0, 152.6);
      ctx.bezierCurveTo(0.0, 167.9, 12.4, 180.3, 27.7, 180.3);
      ctx.lineTo(326.3, 180.3);
      ctx.bezierCurveTo(341.6, 180.3, 354.0, 167.9, 354.0, 152.6);
      ctx.lineTo(354.0, 27.7);
      ctx.bezierCurveTo(354.0, 12.4, 341.6, 0.0, 326.3, 0.0);
      ctx.lineTo(27.7, 0.0);
      ctx.bezierCurveTo(12.4, 0.0, 0.0, 12.4, 0.0, 27.7);
      ctx.closePath();

      // layer1/Group/Compound Path/Path
      ctx.moveTo(292.0, 13.9);
      ctx.lineTo(292.0, 166.4);
      ctx.lineTo(62.0, 166.4);
      ctx.lineTo(62.0, 13.9);
      ctx.lineTo(292.0, 13.9);
      ctx.closePath();
      ctx.fill();

      // layer1/Group/Live Paint Group

      // layer1/Group/Live Paint Group/Group

      // layer1/Group/Live Paint Group/Group/Path
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(321.7, 72.8);
      ctx.bezierCurveTo(331.3, 72.8, 339.0, 80.6, 339.0, 90.2);
      ctx.bezierCurveTo(339.0, 99.7, 331.3, 107.5, 321.7, 107.5);
      ctx.bezierCurveTo(312.1, 107.5, 304.4, 99.7, 304.4, 90.2);
      ctx.bezierCurveTo(304.4, 80.6, 312.1, 72.8, 321.7, 72.8);
      ctx.closePath();
      ctx.fillStyle = "rgb(32, 32, 32)";
      ctx.fill();

      // layer1/Group/Live Paint Group/Group
      ctx.restore();

      // layer1/Group/Live Paint Group/Group/
      ctx.save();

      // layer1/Group
      ctx.restore();
      ctx.restore();

      // layer1/Group/Path
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(161.9, 91.4);
      ctx.lineTo(162.6, 90.7);
      ctx.lineTo(134.7, 62.9);
      ctx.lineTo(106.9, 90.7);
      ctx.lineTo(128.3, 90.7);
      ctx.bezierCurveTo(128.6, 103.0, 133.4, 115.1, 142.7, 124.4);
      ctx.bezierCurveTo(161.9, 143.6, 193.1, 143.6, 212.3, 124.4);
      ctx.bezierCurveTo(231.5, 105.2, 231.5, 74.0, 212.3, 54.8);
      ctx.bezierCurveTo(202.7, 45.2, 190.1, 40.4, 177.5, 40.4);
      ctx.lineTo(177.5, 53.8);
      ctx.bezierCurveTo(186.7, 53.8, 195.9, 57.3, 202.9, 64.2);
      ctx.bezierCurveTo(216.8, 78.2, 216.8, 101.0, 202.9, 114.9);
      ctx.bezierCurveTo(188.9, 128.9, 166.2, 128.9, 152.2, 114.9);
      ctx.bezierCurveTo(145.5, 108.2, 142.0, 99.5, 141.7, 90.7);
      ctx.lineTo(161.9, 90.7);
      ctx.lineTo(161.9, 91.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.restore();
}
