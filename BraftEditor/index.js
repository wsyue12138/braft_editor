import React, { useState, useEffect } from 'react';
import { Upload, Icon } from 'antd';
import BraftEditor from 'braft-editor';
import { ContentUtils } from 'braft-utils';
import Table from 'braft-extensions/dist/table';
import { showConfirm, getUserData } from '@utils/utils';
import styles from './style.less';
import 'braft-editor/dist/index.css';
import 'braft-extensions/dist/table.css';
// import 'braft-extensions/dist/emoticon.css';

// 输出表格默认不带边框，如果需要边框，设置参数exportAttrString为'border="1" style="border-collapse: collapse"'
const options = {
  defaultColumns: 5, // 默认列数
  defaultRows: 5, // 默认行数
  withDropdown: true, // 插入表格前是否弹出下拉菜单
  columnResizable: true, // 是否允许拖动调整列宽，默认false
  exportAttrString: 'border="1"', // 指定输出HTML时附加到table标签上的属性字符串
  // includeEditors: ['id-1'], // 指定该模块对哪些BraftEditor生效，不传此属性则对所有BraftEditor有效
  // excludeEditors: ['id-2']  // 指定该模块对哪些BraftEditor无效
};

let timer = null;

const BraftEditorModule = (props) => {
  const { editorContent, onChange } = props;
  const { data = {} } = getUserData();
  const { token = '' } = data;
  const excludeControls = ['superscript', 'subscript', 'blockquote', 'emoji', 'code', 'media'];

  const [editorState, setEditorState] = useState(BraftEditor.createEditorState(editorContent));

  BraftEditor.use(Table(options));

  //上传之前处理
  const beforeUpload = (file) => {
    const isJpgOrPng =
      file.type === 'image/jpg' ||
      file.type === 'image/png' ||
      file.type === 'image/gif' ||
      file.type === 'image/jpeg';
    if (!isJpgOrPng) {
      showConfirm({ type: 'warning', text: '只可上传 JPG/PNG/Gif 文件!' });
    }
    const isLt2M = file.size / 1024 / 1024 < 5;
    if (!isLt2M) {
      showConfirm({ type: 'warning', text: '文件大小不得超过5M!' });
    }
    return isJpgOrPng && isLt2M;
  };

  //图片上传反馈
  const imageChange = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      const response = info.file.response;
      const { ret_code } = response;
      if (ret_code === 1) {
        const obj = response.data[0];
        const newEditorState = ContentUtils.insertMedias(editorState, [
          {
            type: 'IMAGE',
            url: obj.value,
          },
        ]);
        setEditorState(newEditorState);
      } else {
        if (ret_code === 11019) {
          showConfirm({ type: 'error', text: '仅支持上传jpg,png,gif文件!' });
        } else {
          showConfirm({ type: 'error', text: '上传失败,请稍后重试' });
        }
      }
    } else if (info.file.status === 'error') {
      showConfirm({ type: 'error', text: '上传失败，请稍后重试' });
    }
  };

  //自定义表情
  // const emoticons = defaultEmoticons.map(item => require(`braft-extensions/dist/assets/${item}`));
  // BraftEditor.use(Emoticon({
  //     includeEditors: ['demo-editor-with-emoticon'],
  //     emoticons: emoticons
  // }))

  //上传参数
  const uploadProps = {
    accept: '.jpg, .png, .gif',
    action: '/JinhuaService/knowledge/saveImg',
    name: 'file',
    method: 'post',
    headers: { token },
    showUploadList: false,
    beforeUpload,
    onChange: imageChange,
  };

  //图片上传按钮
  const extendControls = [
    {
      key: 'antd-uploader',
      type: 'component',
      component: (
        <Upload {...uploadProps}>
          {/* 这里的按钮最好加上type="button"，以避免在表单容器中触发表单提交，用Antd的Button组件则无需如此 */}
          <button type="button" className="control-item button upload-button" data-title="插入图片">
            <Icon type="picture" theme="filled" />
          </button>
        </Upload>
      ),
    },
  ];

  //富文本内容变更
  const handleChange = (editorState) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      setEditorState(editorState);
      onChange(editorState);
    },300);
  };

  useEffect(() => {
    setEditorState(BraftEditor.createEditorState(editorContent));
  }, [editorContent]);

  return (
    <BraftEditor
      id="demo-editor-with-emoticon"
      className={styles.box}
      contentStyle={{ height: '210px', background: '#fafafa' }}
      placeholder="请输入内容"
      value={editorState}
      onChange={handleChange}
      excludeControls={excludeControls}
      extendControls={extendControls}
    />
  );
};

export default BraftEditorModule;
