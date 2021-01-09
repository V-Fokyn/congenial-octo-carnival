import React, {useState, useEffect, useRef} from 'react'
import {interval, Subject, EMPTY} from 'rxjs'
import {map, takeUntil, switchMap, startWith, scan} from 'rxjs/operators'

import './Stopwatch.css'

const stop$ = new Subject()
const reset$ = new Subject()

export default function Stopwatch() {

  const [stopwatch, setStopwatch] = useState({hours: 0, minutes: 0, seconds: 0, value: 0})
  const [isStarted, setIsStarted] = useState(false)
  let subscription = useRef()

  const stopwatchObservable$ = interval(1000).pipe(
    startWith(stopwatch.value),
    scan(v => v + 1),
    map(v => {
      return {
        hours: Math.floor(v / 3600),
        minutes: Math.floor(v / 60),
        seconds: v % 60,
        value: v
      }
    }),
    takeUntil(stop$)
  )
  
  const resetable$ = reset$.pipe(
    switchMap(paused => paused ? EMPTY : stopwatchObservable$)
  )

  useEffect(() => {
    
    return () => {
      if(subscription.current)
        subscription.current.unsubscribe()
    }

  }, [])

  const handleClick = e => {

    switch(e.target.name) {
      case 'start': 
        setIsStarted(true)
        if(!subscription.current) {
          subscription.current = resetable$.subscribe(v => setStopwatch(v))
          reset$.next(false)
        }
        break
      
      case 'stop': 
        setIsStarted(false)
        subscription.current.unsubscribe()
        subscription.current = null
        setStopwatch({hours: 0, minutes: 0, seconds: 0, value: 0})
        break
      
      case 'wait':
        setIsStarted(false)
        if(subscription.current) {
          subscription.current.unsubscribe()
          subscription.current = null
        }
        break

      case 'reset':
        reset$.next(true)
        reset$.next(false)
        setStopwatch({hours: 0, minutes: 0, seconds: 0, value: 0})
        break

      default: 
        break
    }
  }

  return (
    <div className="stopwatch">
      <div className="stopwatch__time">
        {`${stopwatch.hours > 9 ? stopwatch.hours : "0" + stopwatch.hours}:${stopwatch.minutes > 9 ? stopwatch.minutes : "0" + stopwatch.minutes}:${stopwatch.seconds > 9 ? stopwatch.seconds : "0" + stopwatch.seconds}`}
      </div>
      <div className="stopwatch__buttons">
        {isStarted ? 
          <button className="stopwatch__buttons__button stopwatch__buttons__stop" name="stop" onClick={handleClick}>Stop</button>
          : 
          <button className="stopwatch__buttons__button stopwatch__buttons__start" name="start" onClick={handleClick}>Start</button>
        }
        <button className="stopwatch__buttons__button stopwatch__buttons__wait" name="wait" onDoubleClick={handleClick}>Wait</button>
        <button className="stopwatch__buttons__button stopwatch__buttons__reset" name="reset" onClick={handleClick}>Reset</button>
      </div>
    </div>
  )
}