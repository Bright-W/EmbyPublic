/**
 * @description [emby调用第三方播放器播放 支持：Infuse、nPlayer、VLC 、IINA、Movist Pro]
 */

let requestURL = $request.url;
let addLink = '/Users';
let embyPlguin = '/plugin/scheme/';
if(requestURL.indexOf(addLink) != -1){  // 添加外部播放器链接
  let host = getHost(requestURL);
  let query = getQueryVariable(requestURL);
  let obj = JSON.parse($response.body);

  let infusePlay = [];
  let nplayerPlay = [];
  let vlcPlay = [];
  let iinaPlay = [];
  let movistproPlay = [];
  let shuDownload = [];

  if(obj.MediaSources){
    obj.MediaSources.forEach((item, index) => {
      let fileName = item['Path'].substring(item['Path'].lastIndexOf('/') + 1);
      let videoUrl = host + '/Videos/'+ obj.Id +'/stream/' + encodeURIComponent(fileName) + '?MediaSourceId='+ item.Id +'&Static=true&api_key='+ query['X-Emby-Token'] + '&filename=' + encodeURIComponent(fileName);
      let shuInfo = [{
        'header': {
          'User-Agent': 'Download',
        },
        'url': videoUrl,
        'name': fileName,
        'suspend': false,
      }];

      let Name = '';
      item['MediaStreams'].forEach((t, i) => {
        if(t['Type'] === 'Video' && item['Name']){
          Name = ' - ' + item['Name']
        }

        if(t['Type'] === 'Subtitle' && t['IsExternal'] && t['Path']){
        let subtitleFileName = t['Path'].substring(t['Path'].lastIndexOf('/') + 1)
          shuInfo.push({
            'header': {
              'User-Agent': 'Download',
            },
            'url': host + '/Videos/'+ obj.Id +'/' + item.Id + '/Subtitles/' + t['Index'] + '/Stream.' + t['Codec'] + '/' + encodeURIComponent(subtitleFileName) + '?api_key=' + query['X-Emby-Token'] + '&filename=' + encodeURIComponent(subtitleFileName),
            'name': subtitleFileName,
            'suspend': false,
          });
        }
      });

      infusePlay.push({
        Url: host + embyPlguin + 'infuse://x-callback-url/play?url='+ encodeURIComponent(videoUrl),
        Name: 'Infuse'+ Name
      });

      nplayerPlay.push({
        Url: host + embyPlguin + 'nplayer-'+ videoUrl,
        Name: 'nPlayer'+ Name
      });

      vlcPlay.push({
        Url: host + embyPlguin + 'vlc-x-callback://x-callback-url/stream?url='+ encodeURIComponent(videoUrl),
        Name: 'VLC'+ Name
      });

      iinaPlay.push({
        Url: host + embyPlguin + 'iina://weblink?url='+ encodeURIComponent(videoUrl),
        Name: 'IINA'+ Name
      });

      let movistproInfo = {
        "url": videoUrl,
        "title": fileName
      };
      movistproPlay.push({
        Url: host + embyPlguin + 'movistpro:' + encodeURIComponent(JSON.stringify(movistproInfo)),
        Name: 'Movist Pro' + Name
      });

      shuDownload.push({
        Url: host + embyPlguin + 'shu://gui.download.http?urls='+ encodeURIComponent(JSON.stringify(shuInfo)),
        Name: 'Shu'+ Name
      });
    });
  }

  obj.ExternalUrls = [...obj.ExternalUrls, ...infusePlay, ...nplayerPlay, ...vlcPlay, ...iinaPlay, ...movistproPlay, ...shuDownload];

  $done({
    body: JSON.stringify(obj)
  });
}else if(requestURL.indexOf(embyPlguin) != -1){  // 打开外部播放器
  let isSurge = typeof $httpClient != "undefined";
  let LocationURL = requestURL.split(embyPlguin)[1];
  let modifiedStatus = 'HTTP/1.1 302 Found';
  if(isSurge){
    modifiedStatus = 302;
  }
  $done({
    status: modifiedStatus, 
    headers: { Location: LocationURL }, 
    body: ""
  });
}else if(requestURL.indexOf('/Videos/') != -1 && requestURL.indexOf('/stream/') != -1){  // 视频路径伪静态
  let query = getQueryVariable(requestURL);
  if (typeof(query['filename']) == "undefined" || query['filename'] == "") {
    $done({});
  }
  let isSurge = typeof $httpClient != "undefined";
  if(isSurge){
    requestURL = $request.url.replace('/' + query['filename'], '');
  } else {
    requestURL = $request.path.replace('/' + query['filename'], '');
  }
  console.log(requestURL)
  $done({
    url: requestURL,
    headers: $request.headers
  });

}else if(requestURL.indexOf('/Videos/') != -1 && requestURL.indexOf('/Subtitles/') != -1){ // 字幕路径伪静态
  let query = getQueryVariable(requestURL);
  if (typeof(query['filename']) == "undefined" || query['filename'] == "") {
    $done({});
  }
  let isSurge = typeof $httpClient != "undefined";
  if(isSurge){
    requestURL = $request.url.replace('/' + query['filename'], '');
  } else {
    requestURL = $request.path.replace('/' + query['filename'], '');
  }
  console.log(requestURL)
  $done({
    url: requestURL,
    headers: $request.headers
  });

}else {
  $done({});
}



function getHost(url) {
  return url.toLowerCase().match(/^(https?:\/\/.*?)\//)[1];
}

function getQueryVariable(url) {
  let index = url.lastIndexOf('?');
  let query = url.substring(index + 1, url.length);
  let vars = query.split("&");
  let querys = new Object();
  for (let i = 0; i < vars.length; i++) {
    let pair = vars[i].split("=");
    querys[pair[0]] = pair[1]
  }
  if (Object.keys(querys).length == 0) {
    return null;
  } else {
    return querys;
  }
}
