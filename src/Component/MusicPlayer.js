import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import React, {useEffect, useRef, useState} from 'react';
import imagePath from '../constants/imagePath';
import Slider from 'react-native-slider';
import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';
const {width, height} = Dimensions.get('window');
import {openDatabase} from 'react-native-sqlite-storage';
import {dataSong} from '../assets/music/data';
const db = openDatabase({
  name: 'Playlist',
});
const MusicPlayer = () => {
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const scrollX = useRef(new Animated.Value(0)).current;
  const songSlider = useRef(null);
  const [songIndex, setSongIndex] = useState(0);
  const [isModalVisible, setModal] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [favourite, setFavourite] = useState(false);
  const [trackArtWork, setTrackArtWork] = useState();
  const [trackArtist, settrackArtist] = useState();
  const [trackTitle, settrackTitle] = useState();
  const [song, setSong] = useState(dataSong);



  // add data to database
  const addData = (artist, title, url) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO songs (artwork, artist, url, title) VALUES (?, ?, ?, ?)`,
        [imagePath.Baila, artist, url, title],
        (tx, result) => {
          console.log(result, 'this is result of inserting');
        },
        error => console.log(error.message, 'error during insert'),
      );
    });
  };

  // create table in database
  const createTable = () => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS songs (id  INTEGER PRIMARY KEY AUTOINCREMENT, artwork VARCHAR(50), title VARCHAR(30), artist VARCHAR(30), url text)',
        [],
        (sqlTxn, res) => {
          console.log('res', res);
        },
        error => {
          console.log(error.message, 'thi is error');
        },
      );
    });
  };

  const changeRepeatMode = () => {
    if (repeatMode == 'off') setRepeatMode('track');
    if (repeatMode == 'track') setRepeatMode('repeat');
    if (repeatMode == 'repeat') setRepeatMode('off');
  };

  // get data from song table in database
  const getTableData = () => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM songs`,
        [],
        (tx, result) => {
          let len = result.rows.length;
          if (len > 0) {
            let songArray = [];
            for (let i = 0; i < len; i++) {
              let item = result.rows.item(i);
              // console.log(item);
              songArray.push(item);
            }
            songArray = [...song, ...songArray];
            setSong(songArray);
          }
        },
        error => console.log(error),
      );
    });
  };

  const repeatIcon = () => {
    if (repeatMode == 'off') {
      TrackPlayer.setRepeatMode(RepeatMode.Track);
      return imagePath.repeatonce;
    }
    if (repeatMode == 'track') {
      TrackPlayer.setRepeatMode(RepeatMode.Queue);

      return imagePath.repeat;
    }
    if (repeatMode == 'repeat') {
      TrackPlayer.setRepeatMode(RepeatMode.Off);

      return imagePath.norepeat;
    }
  };
  const selectMultipleAudio = async () => {
    try {
      const results = await DocumentPicker.pickMultiple({
        type: [DocumentPicker.types.audio],
      });
      let newSong = [];
      for (const res of results) {
        let data = {
          title: res.name,
          url: res.uri,
          artist: res.type,
          artwork: imagePath.namahshivay,
        };
        newSong.push(data);
      }
      newSong = [...song, ...newSong];
      setSong(newSong);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        alert('Canceled from multiple doc picker');
      } else {
        alert('Unknown Error: ' + JSON.stringify(err));
        throw err;
      }
    }
  };

  const setupPlayer = async () => {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
      ],
    });
    await TrackPlayer.add(song);
  };
  const toggleModal = () => setModal(!isModalVisible);
  const toggleFavourite = () => {
    if (favourite) setFavourite(false);
    else setFavourite(true);
  };
  useTrackPlayerEvents([Event.PlaybackTrackChanged], async event => {
    if (event.type == Event.PlaybackTrackChanged && event.nextTrack != null) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
      const {title, artwork, artist} = track;
      setTrackArtWork(artwork);
      settrackArtist(artist);
      settrackTitle(title);
    }
  });
  const togglePlayback = async playbackState => {
    const currentTrack = await TrackPlayer.getCurrentTrack();
    if (currentTrack != null) {
      if (playbackState == State.Paused) {
        await TrackPlayer.play();
      } else await TrackPlayer.pause();
    }
  };
  const renderMusic = ({item, index}) => {
    // console.log(item, 'this is item');
    return (
      <Animated.View
        style={{width: width, justifyContent: 'center', alignItems: 'center'}}>
        <View style={styles.music}>
          <Image style={styles.musicImage} source={trackArtWork} />
        </View>
      </Animated.View>
    );
  };
  const skipForward = () => {
    songSlider.current.scrollToOffset({
      offset: (songIndex + 1) * width,
    });
  };
  const skipBackward = () => {
    songSlider.current.scrollToOffset({
      offset: (songIndex - 1) * width,
    });
  };

  const skipTo = async trackId => {
    await TrackPlayer.skip(trackId);
  };
  useEffect(() => {
    scrollX.addListener(({value}) => {
      const index = Math.round(value / width);
      skipTo(index);
      setSongIndex(index);
      // console.log(index, 'thi si index');
    });
    return () => {
      scrollX.removeAllListeners();
    };
  }, []);
  // useEffect(() => {
  //   createTable();
  //   getTableData();
  // }, ['notihing']);
  useEffect(() => {
    setupPlayer();
  }, [song]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContainer}>
        <View style={{width: width}}>
          <Animated.FlatList
            ref={songSlider}
            data={song}
            renderItem={renderMusic}
            keyExtractor={(item, index) => index}
            horizontal
            pagingEnabled
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [
                {
                  nativeEvent: {
                    contentOffset: {x: scrollX},
                  },
                },
              ],
              {useNativeDriver: true},
            )}
          />
        </View>

        <View>
          <Text style={styles.title}>{trackTitle}</Text>
          <Text style={styles.artist}>{trackArtist}</Text>
        </View>
        <View>
          <Slider
            style={styles.progressContainer}
            value={progress.position}
            minimumValue={0}
            maximumValue={progress.duration}
            thumbTintColor="#ffd369"
            minimumTrackTintColor="#ffd369"
            maximumTrackTintColor="#fff"
            // step={1}
            onSlidingComplete={async value => {
              await TrackPlayer.seekTo(value);
            }}
          />
        </View>
        <View style={styles.progressLabelContainer}>
          <Text style={styles.progressLabelText}>
            {new Date(progress.position * 1000)
              .toISOString()
              .split('T')[1]
              .slice(0, 8)}
          </Text>
          <Text style={styles.progressLabelText}>
            {new Date((progress.duration - progress.position) * 1000)
              .toISOString()
              .split('T')[1]
              .slice(0, 8)}
          </Text>
        </View>
        <View style={styles.musicControl}>
          <TouchableOpacity onPress={skipBackward}>
            <Image style={styles.smallIcon} source={imagePath.previous} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => togglePlayback(playbackState)}>
            <Image
              style={{height: 48, tintColor: '#fff', width: 48}}
              source={
                playbackState == State.Paused ? imagePath.stop : imagePath.play
              }
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={skipForward}>
            <Image style={styles.smallIcon} source={imagePath.next} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.bottomControl}>
          <TouchableOpacity onPress={toggleFavourite}>
            <Image
              style={styles.smallIcon}
              source={favourite ? imagePath.heartFilled : imagePath.heartBlank}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={changeRepeatMode}>
            <Image style={styles.smallIcon} source={repeatIcon()} />
          </TouchableOpacity>
          <TouchableOpacity onPress={selectMultipleAudio}>
            <Image style={styles.smallIcon} source={imagePath.add} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleModal}>
            <Image style={styles.smallIcon} source={imagePath.playlist} />
          </TouchableOpacity>
        </View>
      </View>
      <Modal visible={isModalVisible} onDismiss={toggleModal}>
        <TouchableOpacity
          onPress={toggleModal}
          style={{
            backgroundColor: 'rgba(100, 100, 100, 0.5)',
            flex: 1,
          }}></TouchableOpacity>
        <View>
          <FlatList
            data={song}
            keyExtractor={(item, index) => index}
            renderItem={({item, index}) => {
              return (
                <TouchableOpacity
                  onPress={() => {
                    // console.log(index, 'this is index at flatlist');
                    setSongIndex(index);
                    songSlider.current.scrollToOffset({
                      offset: index * width,
                    });
                    TrackPlayer.play();
                    toggleModal();
                  }}
                  style={styles.itemBox}>
                  <Image
                    style={{width: 64, height: 64, marginRight: 12}}
                    source={item.artwork}
                  />
                  <View>
                    <Text>{item.artist}</Text>
                    <Text>{item.title}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MusicPlayer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222831',
  },
  mainContainer: {
    //   backgroundColor: 'red',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallIcon: {
    tintColor: '#fff',
    height: 26,
    width: 26,
  },
  music: {
    width: 300,
    alignItems: 'center',
    height: 350,
    marginBottom: 25,
    elevation: 5,
    shadowColor: '#ccc',
    shadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
  },
  musicImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#eeeeee',
  },
  artist: {
    fontSize: 16,
    fontWeight: '200',
    textAlign: 'center',
    color: '#eeeeee',
  },
  progressContainer: {
    // backgroundColor: '#fff',
    alignItems: 'stretch',
    width: 340,
    height: 40,
    marginTop: 25,
    // flexDirection: 'row',
  },
  progressLabelContainer: {
    width: 340,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelText: {
    color: '#fff',
  },
  musicControl: {
    flexDirection: 'row',
    width: '60%',
    justifyContent: 'space-between',
    marginTop: 15,
    alignItems: 'center',
  },
  bottomContainer: {
    borderTopColor: '#393e46',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
  },
  bottomControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
  },

  itemBox: {
    padding: 12,
    backgroundColor: 'white',
    borderBottomColor: 'whiteSmoke',
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
