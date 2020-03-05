// Buttons
const videoElement = document.querySelector('video')
const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')
const videoSelectBtn = document.getElementById('videoSelectBtn')

// Assign event handler functions
videoSelectBtn.onclick = getVideoSources

const { desktopCapturer, remote } = require('electron')
const { Menu } = remote

// Get all available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
  })

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source),
      }
    })
  )

  videoOptionsMenu.popup()
}

let mediaRecorder // MediaRecorder instance to capture footage
const recordedChunks = []

// Assign event handler functions to video buttons
startBtn.onclick = event => {
  mediaRecorder.start()
  startBtn.classList.add('is-danger')
  startBtn.innerText = 'Recording'
}

stopBtn.onclick = event => {
  mediaRecorder.stop()
  startBtn.classList.remove('is-danger')
  startBtn.innerText = 'Start'
}

async function selectSource(source) {
  videoSelectBtn.innerText = source.name
  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id,
      },
    },
  }

  // Create a stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints)

  // Preview the source in a video element
  videoElement.srcObject = stream
  videoElement.play()

  // Create the media recorder
  const options = { mimeType: 'video/webm; codecs=vp9' }
  mediaRecorder = new MediaRecorder(stream, options)

  // Register event handlers
  mediaRecorder.ondataavailable = handleDataAvailable
  mediaRecorder.onstop = handleStop
}

// Captures all recorded chunks
function handleDataAvailable(event) {
  console.log('Video data available')
  recordedChunks.push(event.data)
}

const { dialog } = remote
const { writeFile } = require('fs')

// Saves the video file on stop
async function handleStop(event) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9',
  })

  const buffer = Buffer.from(await blob.arrayBuffer())
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`,
  })

  console.log(filePath)
  writeFile(filePath, buffer, () => console.log('Video saved successfully!'))
}
